import { desc, eq } from "drizzle-orm";
import type { DB } from "../db";
import { FriendLinksTable } from "../db/schema";

export interface FriendLink {
  id: number;
  name: string;
  url: string;
  avatar: string;
  description: string;
  tags: string[];
  status: string;
  email: string;
  siteName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 适配 Mizuki 的 FriendItem 格式
export interface FriendItem {
  id: number;
  title: string;
  imgurl: string;
  desc: string;
  siteurl: string;
  tags: string[];
}

function mapFriendLink(
  link: typeof FriendLinksTable.$inferSelect,
): FriendLink {
  return {
    id: link.id,
    name: link.name,
    url: link.url,
    avatar: link.avatar || "",
    description: link.description || "",
    tags: link.tags || [],
    status: link.status,
    email: link.email || "",
    siteName: link.siteName || "",
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

function mapToFriendItem(link: typeof FriendLinksTable.$inferSelect): FriendItem {
  return {
    id: link.id,
    title: link.name,
    imgurl: link.avatar || "",
    desc: link.description || "",
    siteurl: link.url,
    tags: link.tags || [],
  };
}

export async function getApprovedFriendLinks(
  db: DB,
): Promise<FriendLink[]> {
  const links = await db
    .select()
    .from(FriendLinksTable)
    .where(eq(FriendLinksTable.status, "approved"))
    .orderBy(desc(FriendLinksTable.createdAt));

  return links.map(mapFriendLink);
}

export async function getApprovedFriendItems(
  db: DB,
): Promise<FriendItem[]> {
  const links = await db
    .select()
    .from(FriendLinksTable)
    .where(eq(FriendLinksTable.status, "approved"))
    .orderBy(desc(FriendLinksTable.createdAt));

  return links.map(mapToFriendItem);
}

export function getShuffledFriendItems(items: FriendItem[]): FriendItem[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getAllFriendLinks(
  db: DB,
): Promise<FriendLink[]> {
  const links = await db
    .select()
    .from(FriendLinksTable)
    .orderBy(desc(FriendLinksTable.createdAt));

  return links.map(mapFriendLink);
}

export async function getFriendLinkById(
  db: DB,
  id: number,
): Promise<FriendLink | null> {
  const links = await db
    .select()
    .from(FriendLinksTable)
    .where(eq(FriendLinksTable.id, id))
    .limit(1);

  if (links.length === 0) return null;
  return mapFriendLink(links[0]);
}
