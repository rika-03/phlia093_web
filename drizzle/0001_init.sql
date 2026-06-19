-- Mizuki Blog Database Schema
-- 基于 Cloudflare D1

-- 文章表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at INTEGER,
  updated INTEGER,
  image TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  category TEXT DEFAULT '',
  lang TEXT DEFAULT '',
  pinned INTEGER DEFAULT 0,
  comment INTEGER DEFAULT 1,
  priority INTEGER,
  author TEXT DEFAULT '',
  source_link TEXT DEFAULT '',
  license_name TEXT DEFAULT '',
  license_url TEXT DEFAULT '',
  encrypted INTEGER DEFAULT 0,
  password TEXT DEFAULT '',
  password_hint TEXT DEFAULT '',
  hide_home_content INTEGER DEFAULT 0,
  alias TEXT,
  permalink TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS published_at_idx ON posts (published_at, status);
CREATE INDEX IF NOT EXISTS slug_idx ON posts (slug);
CREATE INDEX IF NOT EXISTS created_at_idx ON posts (created_at);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS post_tags_tag_idx ON post_tags (tag_id);

-- 友链表
CREATE TABLE IF NOT EXISTS friend_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT DEFAULT '',
  site_name TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
