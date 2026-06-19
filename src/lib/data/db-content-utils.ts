import type { DB } from "../db";
import {
  getSortedPosts as getSortedPostsFromDb,
  getPostBySlug,
  getPrevNextPosts,
  getTagList as getTagListFromDb,
  getCategoryList,
  type PostFull,
  type PostForList,
} from "../data/posts";

export interface DbPostEntry {
  id: string;
  slug: string;
  body: string;
  data: {
    title: string;
    published: Date;
    updated?: Date;
    draft: boolean;
    description: string;
    image: string;
    tags: string[];
    category: string | null;
    lang: string;
    pinned: boolean;
    comment: boolean;
    priority?: number;
    author: string;
    sourceLink: string;
    licenseName: string;
    licenseUrl: string;
    encrypted: boolean;
    password: string;
    passwordHint: string;
    hideHomeContent?: boolean;
    alias?: string;
    permalink?: string;
    prevTitle: string;
    prevSlug: string;
    nextTitle: string;
    nextSlug: string;
  };
}

function mapDbPostToEntry(post: PostFull): DbPostEntry {
  return {
    id: String(post.id),
    slug: post.slug,
    body: post.content,
    data: {
      title: post.title,
      published: post.publishedAt || new Date(),
      updated: post.updated || undefined,
      draft: post.draft,
      description: post.description,
      image: post.image,
      tags: post.tags,
      category: post.category || null,
      lang: post.lang,
      pinned: post.pinned,
      comment: post.comment,
      priority: post.priority ?? undefined,
      author: post.author,
      sourceLink: post.sourceLink,
      licenseName: post.licenseName,
      licenseUrl: post.licenseUrl,
      encrypted: post.encrypted,
      password: post.password,
      passwordHint: post.passwordHint,
      hideHomeContent: post.hideHomeContent,
      alias: post.alias || undefined,
      permalink: post.permalink || undefined,
      prevTitle: "",
      prevSlug: "",
      nextTitle: "",
      nextSlug: "",
    },
  };
}

export async function getSortedPosts(db: DB): Promise<DbPostEntry[]> {
  const posts = await getSortedPostsFromDb(db);

  const entries: DbPostEntry[] = [];
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const fullPost = await getPostBySlug(db, post.slug);
    if (!fullPost) continue;

    const entry = mapDbPostToEntry(fullPost);

    if (i > 0) {
      entry.data.prevTitle = posts[i - 1].title;
      entry.data.prevSlug = posts[i - 1].slug;
    }
    if (i < posts.length - 1) {
      entry.data.nextTitle = posts[i + 1].title;
      entry.data.nextSlug = posts[i + 1].slug;
    }

    entries.push(entry);
  }

  return entries;
}

export async function getPostBySlugWithPrevNext(
  db: DB,
  slug: string,
): Promise<DbPostEntry | null> {
  const post = await getPostBySlug(db, slug);
  if (!post) return null;

  const { prev, next } = await getPrevNextPosts(db, post.id);
  const entry = mapDbPostToEntry(post);

  if (prev) {
    entry.data.prevTitle = prev.title;
    entry.data.prevSlug = prev.slug;
  }
  if (next) {
    entry.data.nextTitle = next.title;
    entry.data.nextSlug = next.slug;
  }

  return entry;
}

export interface Tag {
  name: string;
  count: number;
}

export async function getTagList(db: DB): Promise<Tag[]> {
  return await getTagListFromDb(db);
}

export async function getCategoryListWithCount(
  db: DB,
): Promise<{ name: string; count: number }[]> {
  return await getCategoryList(db);
}
