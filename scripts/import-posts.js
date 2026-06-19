#!/usr/bin/env node
/**
 * 将 Markdown 文章导入到 Cloudflare D1 数据库
 *
 * 使用方法：
 * 1. 配置 .env 文件
 * 2. 运行：node scripts/import-posts.js
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import matter from "gray-matter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const postsDir = join(__dirname, "../src/content/posts");

  console.log("📖 读取 Markdown 文件...");

  const files = await readdir(postsDir, { recursive: true });
  const mdFiles = files.filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  console.log(`找到 ${mdFiles.length} 篇文章\n`);

  const posts = [];

  for (const file of mdFiles) {
    const filePath = join(postsDir, file);
    const content = await readFile(filePath, "utf-8");
    const { data, content: body } = matter(content);

    const slug = file.replace(/\.(md|mdx)$/, "").replace(/\\/g, "/");

    const post = {
      title: data.title || slug,
      slug: data.slug || slug,
      description: data.description || "",
      content: body,
      status: data.draft ? "draft" : "published",
      published_at: data.published ? new Date(data.published).getTime() / 1000 : Date.now() / 1000,
      updated: data.updated ? new Date(data.updated).getTime() / 1000 : null,
      image: data.image || "",
      tags: JSON.stringify(data.tags || []),
      category: data.category || "",
      lang: data.lang || "",
      pinned: data.pinned ? 1 : 0,
      comment: data.comment !== false ? 1 : 0,
      priority: data.priority || null,
      author: data.author || "",
      source_link: data.sourceLink || "",
      license_name: data.licenseName || "",
      license_url: data.licenseUrl || "",
      encrypted: data.encrypted ? 1 : 0,
      password: data.password || "",
      password_hint: data.passwordHint || "",
      hide_home_content: data.hideHomeContent ? 1 : 0,
      alias: data.alias || null,
      permalink: data.permalink || null,
    };

    posts.push(post);
    console.log(`  ✅ ${post.title}`);
  }

  console.log(`\n📊 共解析 ${posts.length} 篇文章`);
  console.log("\n💡 接下来你可以：");
  console.log("   1. 使用 wrangler 批量导入数据");
  console.log("   2. 或者使用 Drizzle 编写导入脚本");
  console.log("\n📝 示例 SQL（单篇文章）：");
  console.log(`
INSERT INTO posts (
  title, slug, description, content, status,
  published_at, updated, image, tags, category,
  lang, pinned, comment, priority, author,
  source_link, license_name, license_url,
  encrypted, password, password_hint,
  hide_home_content, alias, permalink
) VALUES (
  '${posts[0]?.title || "示例标题"}',
  '${posts[0]?.slug || "example-slug"}',
  '${posts[0]?.description || ""}',
  '文章内容...',
  'published',
  ${posts[0]?.published_at || Date.now() / 1000},
  NULL,
  '',
  '[]',
  '',
  '',
  0,
  1,
  NULL,
  '',
  '',
  '',
  '',
  0,
  '',
  '',
  0,
  NULL,
  NULL
);
  `);

  // 输出 JSON 格式，方便后续处理
  const outputPath = join(__dirname, "../posts-export.json");
  await writeFile(outputPath, JSON.stringify(posts, null, 2));
  console.log(`\n💾 文章数据已导出到: ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ 导入失败:", err);
  process.exit(1);
});
