import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id, updatedAt } from "./helper";

export const POST_STATUSES = ["draft", "published"] as const;

export const PostsTable = sqliteTable(
  "posts",
  {
    id,
    title: text().notNull(),
    slug: text().notNull().unique(),
    description: text().default(""),
    content: text().notNull(),
    status: text("status", { enum: POST_STATUSES }).notNull().default("draft"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    updated: integer("updated", { mode: "timestamp" }),
    image: text().default(""),
    tags: text({ mode: "json" }).$type<string[]>().default([]),
    category: text().default(""),
    lang: text().default(""),
    pinned: integer({ mode: "boolean" }).default(false),
    comment: integer({ mode: "boolean" }).default(true),
    priority: integer(),
    author: text().default(""),
    sourceLink: text("source_link").default(""),
    licenseName: text("license_name").default(""),
    licenseUrl: text("license_url").default(""),
    encrypted: integer({ mode: "boolean" }).default(false),
    password: text().default(""),
    passwordHint: text("password_hint").default(""),
    hideHomeContent: integer("hide_home_content", { mode: "boolean" }).default(false),
    alias: text(),
    permalink: text(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("published_at_idx").on(table.publishedAt, table.status),
    index("slug_idx").on(table.slug),
  ],
);

export const TagsTable = sqliteTable("tags", {
  id,
  name: text().notNull().unique(),
  createdAt,
});

export const PostTagsTable = sqliteTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => PostsTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => TagsTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("post_tags_tag_idx").on(table.tagId),
  ],
);

// ==================== relations ====================
export const postsRelations = relations(PostsTable, ({ many }) => ({
  postTags: many(PostTagsTable),
}));

export const tagsRelations = relations(TagsTable, ({ many }) => ({
  postTags: many(PostTagsTable),
}));

export const postTagsRelations = relations(PostTagsTable, ({ one }) => ({
  post: one(PostsTable, {
    fields: [PostTagsTable.postId],
    references: [PostsTable.id],
  }),
  tag: one(TagsTable, {
    fields: [PostTagsTable.tagId],
    references: [TagsTable.id],
  }),
}));

// ==================== types ====================
export type Tag = typeof TagsTable.$inferSelect;
export type Post = typeof PostsTable.$inferSelect;
export type PostStatus = (typeof POST_STATUSES)[number];
