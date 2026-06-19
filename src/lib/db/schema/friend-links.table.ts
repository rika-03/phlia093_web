import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id, updatedAt } from "./helper";

export const FRIEND_LINK_STATUSES = ["pending", "approved", "rejected"] as const;

export const FriendLinksTable = sqliteTable("friend_links", {
  id,
  name: text().notNull(),
  url: text().notNull(),
  avatar: text().default(""),
  description: text().default(""),
  tags: text("tags", { mode: "json" }).default([]).$type<string[]>(),
  status: text("status", { enum: FRIEND_LINK_STATUSES }).notNull().default("pending"),
  email: text().default(""),
  siteName: text("site_name").default(""),
  createdAt,
  updatedAt,
});

export type FriendLink = typeof FriendLinksTable.$inferSelect;
export type FriendLinkStatus = (typeof FRIEND_LINK_STATUSES)[number];
