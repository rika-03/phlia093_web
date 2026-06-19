import { desc, eq, like, sql } from "drizzle-orm";
import type { DB } from "../db";
import { PostsTable, PostTagsTable, TagsTable } from "../db/schema";

export interface PostForList {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
  publishedAt: Date | null;
  updated: Date | null;
  pinned: boolean;
  priority: number | null;
  draft: boolean;
}

export interface PostFull extends PostForList {
  content: string;
  lang: string;
  comment: boolean;
  author: string;
  sourceLink: string;
  licenseName: string;
  licenseUrl: string;
  encrypted: boolean;
  password: string;
  passwordHint: string;
  hideHomeContent: boolean;
  alias: string | null;
  permalink: string | null;
}

function mapPostToList(post: typeof PostsTable.$inferSelect): PostForList {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    description: post.description || "",
    image: post.image || "",
    tags: post.tags || [],
    category: post.category || "",
    publishedAt: post.publishedAt,
    updated: post.updated,
    pinned: post.pinned || false,
    priority: post.priority ?? null,
    draft: post.status === "draft",
  };
}

function mapPostToFull(post: typeof PostsTable.$inferSelect): PostFull {
  return {
    ...mapPostToList(post),
    content: post.content,
    lang: post.lang || "",
    comment: post.comment || true,
    author: post.author || "",
    sourceLink: post.sourceLink || "",
    licenseName: post.licenseName || "",
    licenseUrl: post.licenseUrl || "",
    encrypted: post.encrypted || false,
    password: post.password || "",
    passwordHint: post.passwordHint || "",
    hideHomeContent: post.hideHomeContent || false,
    alias: post.alias ?? null,
    permalink: post.permalink ?? null,
  };
}

export async function getSortedPosts(db: DB): Promise<PostForList[]> {
  const posts = await db
    .select()
    .from(PostsTable)
    .where(eq(PostsTable.status, "published"))
    .orderBy(
      sql`CASE WHEN ${PostsTable.pinned} = 1 THEN 0 ELSE 1 END`,
      sql`CASE WHEN ${PostsTable.pinned} = 1 THEN ${PostsTable.priority} ELSE NULL END ASC`,
      desc(PostsTable.publishedAt),
    );

  return posts.map(mapPostToList);
}

export async function getPostBySlug(
  db: DB,
  slug: string,
): Promise<PostFull | null> {
  const posts = await db
    .select()
    .from(PostsTable)
    .where(eq(PostsTable.slug, slug))
    .limit(1);

  if (posts.length === 0) return null;
  return mapPostToFull(posts[0]);
}

export async function getPostsByTag(
  db: DB,
  tag: string,
): Promise<PostForList[]> {
  const posts = await db
    .select({
      post: PostsTable,
    })
    .from(PostsTable)
    .innerJoin(PostTagsTable, eq(PostTagsTable.postId, PostsTable.id))
    .innerJoin(TagsTable, eq(TagsTable.id, PostTagsTable.tagId))
    .where(eq(TagsTable.name, tag))
    .where(eq(PostsTable.status, "published"))
    .orderBy(desc(PostsTable.publishedAt));

  return posts.map((p) => mapPostToList(p.post));
}

export async function getPostsByCategory(
  db: DB,
  category: string,
): Promise<PostForList[]> {
  const posts = await db
    .select()
    .from(PostsTable)
    .where(eq(PostsTable.category, category))
    .where(eq(PostsTable.status, "published"))
    .orderBy(desc(PostsTable.publishedAt));

  return posts.map(mapPostToList);
}

export async function getTagList(
  db: DB,
): Promise<{ name: string; count: number }[]> {
  const result = await db
    .select({
      name: TagsTable.name,
      count: sql<number>`COUNT(${PostTagsTable.postId})`,
    })
    .from(TagsTable)
    .leftJoin(PostTagsTable, eq(PostTagsTable.tagId, TagsTable.id))
    .groupBy(TagsTable.id)
    .orderBy(({ count }) => desc(count));

  return result.map((r) => ({
    name: r.name,
    count: r.count,
  }));
}

export async function getCategoryList(
  db: DB,
): Promise<{ name: string; count: number }[]> {
  const result = await db
    .select({
      name: PostsTable.category,
      count: sql<number>`COUNT(${PostsTable.id})`,
    })
    .from(PostsTable)
    .where(eq(PostsTable.status, "published"))
    .groupBy(PostsTable.category)
    .orderBy(({ count }) => desc(count));

  return result
    .filter((r) => r.name && r.name.trim() !== "")
    .map((r) => ({
      name: r.name || "",
      count: r.count,
    }));
}

export async function getPrevNextPosts(
  db: DB,
  postId: number,
): Promise<{ prev: PostForList | null; next: PostForList | null }> {
  const currentPost = await db
    .select()
    .from(PostsTable)
    .where(eq(PostsTable.id, postId))
    .limit(1);

  if (currentPost.length === 0 || !currentPost[0].publishedAt) {
    return { prev: null, next: null };
  }

  const publishedAt = currentPost[0].publishedAt;

  const prevPosts = await db
    .select()
    .from(PostsTable)
    .where(sql`${PostsTable.publishedAt} < ${publishedAt}`)
    .where(eq(PostsTable.status, "published"))
    .orderBy(desc(PostsTable.publishedAt))
    .limit(1);

  const nextPosts = await db
    .select()
    .from(PostsTable)
    .where(sql`${PostsTable.publishedAt} > ${publishedAt}`)
    .where(eq(PostsTable.status, "published"))
    .orderBy(PostsTable.publishedAt)
    .limit(1);

  return {
    prev: prevPosts.length > 0 ? mapPostToList(prevPosts[0]) : null,
    next: nextPosts.length > 0 ? mapPostToList(nextPosts[0]) : null,
  };
}

export async function searchPosts(
  db: DB,
  query: string,
): Promise<PostForList[]> {
  const posts = await db
    .select()
    .from(PostsTable)
    .where(
      sql`(${PostsTable.title} LIKE ${`%${query}%`} OR ${PostsTable.description} LIKE ${`%${query}%`})`,
    )
    .where(eq(PostsTable.status, "published"))
    .orderBy(desc(PostsTable.publishedAt))
    .limit(50);

  return posts.map(mapPostToList);
}
