# Mizuki Blog + Cloudflare 后端整合部署教程

## 项目概述

本项目将 Mizuki 博客主题与 Cloudflare 后端服务整合，实现：
- **前端**：完全保留 Mizuki 的设计风格和所有页面
- **后端**：使用 Cloudflare D1 数据库、R2 对象存储、KV 缓存
- **部署**：Cloudflare Pages + GitHub Actions 自动部署

## 技术栈

- **前端框架**：Astro 6.x + Svelte
- **样式**：Tailwind CSS 4.x
- **数据库**：Cloudflare D1 + Drizzle ORM
- **对象存储**：Cloudflare R2
- **缓存**：Cloudflare KV
- **部署**：Cloudflare Pages

---

## 一、前置要求

1. Cloudflare 账号
2. GitHub 账号
3. Node.js 18+
4. pnpm 包管理器

---

## 二、安装依赖

```bash
# 进入项目目录
cd Mizuki-blog

# 安装依赖
pnpm install

# 添加 Cloudflare 相关依赖
pnpm add @astrojs/cloudflare drizzle-orm
pnpm add -D drizzle-kit
```

---

## 三、Cloudflare 服务配置

### 3.1 创建 D1 数据库

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **D1**
3. 点击 **Create database**
4. 输入数据库名称（如 `mizuki-blog-db`）
5. 点击 **Create**
6. 记录下 **Database ID**

### 3.2 创建 R2 存储桶

1. 进入 **R2** → **Create bucket**
2. 输入桶名称（如 `mizuki-blog-media`）
3. 点击 **Create bucket**

### 3.3 创建 KV 命名空间

1. 进入 **Workers & Pages** → **KV**
2. 点击 **Create a namespace**
3. 输入名称（如 `mizuki-blog-cache`）
4. 点击 **Add**
5. 记录下 **Namespace ID**

---

## 四、配置文件修改

### 4.1 修改 wrangler.toml

编辑项目根目录下的 `wrangler.toml`：

```toml
name = "mizuki-blog"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "./dist"

# D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "mizuki-blog-db"
database_id = "你的D1数据库ID"

# R2 对象存储
[[r2_buckets]]
binding = "R2"
bucket_name = "你的R2桶名称"

# KV 缓存
[[kv_namespaces]]
binding = "KV"
id = "你的KV命名空间ID"

# 环境变量
[vars]
NODE_ENV = "production"
```

### 4.2 配置站点信息

编辑 `src/config/site.config.ts`，修改站点 URL、标题等信息。

---

## 五、数据库迁移

### 5.1 配置环境变量

创建 `.env` 文件：

```env
# Cloudflare API 配置
CLOUDFLARE_ACCOUNT_ID=你的Account ID
CLOUDFLARE_API_TOKEN=你的API Token
D1_DATABASE_ID=你的D1数据库ID
```

**获取 API Token**：
1. Cloudflare Dashboard → 右上角头像 → **My Profile** → **API Tokens**
2. 点击 **Create Token**
3. 选择 **Edit Cloudflare Workers** 模板
4. 权限选择：Account - D1 - Edit, Account - R2 - Edit, Account - KV - Edit
5. 点击 **Continue to summary** → **Create Token**
6. 记录下生成的 Token（只显示一次）

**获取 Account ID**：
- Cloudflare Dashboard 首页右侧可以看到 **Account ID**

### 5.2 执行迁移

```bash
# 生成迁移文件（可选，已提供初始迁移文件）
pnpm drizzle-kit generate

# 应用迁移到 D1 数据库
pnpm drizzle-kit migrate
```

或者直接使用 wrangler 执行 SQL：

```bash
npx wrangler d1 execute mizuki-blog-db --file=./drizzle/0001_init.sql
```

---

## 六、本地开发

### 6.1 配置本地开发环境

创建 `.dev.vars` 文件（用于 wrangler 本地开发）：

```env
# 本地开发时可以使用远程 D1 数据库，或者使用本地 SQLite
```

### 6.2 启动开发服务器

```bash
# 方式一：Astro 开发服务器（需要配置远程 D1）
pnpm dev

# 方式二：使用 wrangler pages dev（推荐）
npx wrangler pages dev --d1=DB --r2=R2 --kv=KV -- pnpm dev
```

---

## 七、部署到 Cloudflare Pages

### 7.1 手动部署

```bash
# 构建项目
pnpm build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist
```

### 7.2 绑定 D1、R2、KV

部署完成后，需要在 Cloudflare Dashboard 中绑定服务：

1. 进入 **Workers & Pages** → 选择你的 Pages 项目
2. 进入 **Settings** → **Functions**
3. 找到 **D1 database bindings** → **Add binding**
   - Variable name: `DB`
   - D1 database: 选择你创建的数据库
4. 找到 **R2 bucket bindings** → **Add binding**
   - Variable name: `R2`
   - R2 bucket: 选择你创建的桶
5. 找到 **KV namespace bindings** → **Add binding**
   - Variable name: `KV`
   - KV namespace: 选择你创建的命名空间
6. 重新部署项目

---

## 八、GitHub Actions 自动部署

### 8.1 配置 GitHub Secrets

在 GitHub 仓库的 **Settings** → **Secrets and variables** → **Actions** 中添加以下 Secrets：

| Secret 名称 | 说明 |
|------------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| `D1_DATABASE_ID` | D1 数据库 ID |
| `KV_NAMESPACE_ID` | KV 命名空间 ID |
| `BUCKET_NAME` | R2 桶名称 |

### 8.2 创建部署工作流

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build
        env:
          NODE_ENV: production

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=mizuki-blog
```

### 8.3 配置 Pages 项目

首次部署前，需要先在 Cloudflare 上创建 Pages 项目：

1. 进入 **Workers & Pages** → **Create application** → **Pages**
2. 选择 **Connect to Git**
3. 选择你的 GitHub 仓库
4. 构建设置：
   - Framework preset: `Astro`
   - Build command: `pnpm build`
   - Build output directory: `dist`
5. 点击 **Save and Deploy**

部署完成后，记得按照第七步绑定 D1、R2、KV 服务。

---

## 九、数据导入

### 9.1 从 Markdown 文件导入文章

如果你有现有的 Markdown 文章需要导入到数据库，可以创建一个导入脚本。

创建 `scripts/import-posts.js`：

```javascript
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

async function importPosts() {
  const postsDir = './src/content/posts';
  const files = await readdir(postsDir);

  const posts = [];

  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;

    const filePath = join(postsDir, file);
    const content = await readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    const slug = file.replace(/\.(md|mdx)$/, '');

    posts.push({
      title: data.title || slug,
      slug: data.slug || slug,
      description: data.description || '',
      content: body,
      status: data.draft ? 'draft' : 'published',
      published_at: data.published ? new Date(data.published).getTime() : Date.now(),
      updated: data.updated ? new Date(data.updated).getTime() : null,
      image: data.image || '',
      tags: JSON.stringify(data.tags || []),
      category: data.category || '',
      lang: data.lang || '',
      pinned: data.pinned ? 1 : 0,
      comment: data.comment !== false ? 1 : 0,
      priority: data.priority || null,
      author: data.author || '',
      source_link: data.sourceLink || '',
      license_name: data.licenseName || '',
      license_url: data.licenseUrl || '',
      encrypted: data.encrypted ? 1 : 0,
      password: data.password || '',
      password_hint: data.passwordHint || '',
      hide_home_content: data.hideHomeContent ? 1 : 0,
      alias: data.alias || null,
      permalink: data.permalink || null,
    });
  }

  console.log(JSON.stringify(posts, null, 2));
  console.log(`\n共找到 ${posts.length} 篇文章`);
}

importPosts().catch(console.error);
```

运行脚本：

```bash
node scripts/import-posts.js
```

然后将生成的数据插入到 D1 数据库中。

---

## 十、项目结构说明

```
Mizuki-blog/
├── src/
│   ├── lib/
│   │   ├── db/                    # 数据库相关
│   │   │   ├── schema/            # 数据库表结构
│   │   │   │   ├── helper.ts      # 通用字段定义
│   │   │   │   ├── posts.table.ts # 文章表
│   │   │   │   ├── friend-links.table.ts # 友链表
│   │   │   │   └── index.ts       # Schema 导出
│   │   │   └── index.ts           # 数据库连接
│   │   ├── data/                  # 数据访问层
│   │   │   ├── posts.ts           # 文章数据操作
│   │   │   ├── friend-links.ts    # 友链数据操作
│   │   │   └── db-content-utils.ts # 数据库版内容工具
│   │   ├── cloudflare.ts          # Cloudflare 服务工具
│   │   ├── r2.ts                  # R2 对象存储工具
│   │   └── kv.ts                  # KV 缓存工具
│   ├── components/                # 组件（保持原样）
│   ├── pages/                     # 页面（保持原样）
│   ├── config/                    # 配置文件（保持原样）
│   └── ...
├── drizzle/                       # 数据库迁移文件
│   └── 0001_init.sql
├── astro.config.mjs               # Astro 配置（已修改）
├── wrangler.toml                  # Wrangler 配置
├── drizzle.config.ts              # Drizzle 配置
└── package.json
```

---

## 十一、数据库表结构

### posts（文章表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| title | TEXT | 文章标题 |
| slug | TEXT | 文章别名（唯一） |
| description | TEXT | 文章摘要 |
| content | TEXT | 文章内容（Markdown） |
| status | TEXT | 状态：draft/published |
| published_at | INTEGER | 发布时间（时间戳） |
| updated | INTEGER | 更新时间（时间戳） |
| image | TEXT | 封面图片 URL |
| tags | TEXT | 标签（JSON 数组） |
| category | TEXT | 分类 |
| lang | TEXT | 语言 |
| pinned | INTEGER | 是否置顶 |
| comment | INTEGER | 是否启用评论 |
| priority | INTEGER | 置顶优先级 |
| author | TEXT | 作者 |
| source_link | TEXT | 来源链接 |
| license_name | TEXT | 许可证名称 |
| license_url | TEXT | 许可证链接 |
| encrypted | INTEGER | 是否加密 |
| password | TEXT | 密码 |
| password_hint | TEXT | 密码提示 |
| hide_home_content | INTEGER | 首页隐藏内容 |
| alias | TEXT | 别名 |
| permalink | TEXT | 固定链接 |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

### tags（标签表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 标签名（唯一） |
| created_at | INTEGER | 创建时间 |

### post_tags（文章标签关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| post_id | INTEGER | 文章 ID |
| tag_id | INTEGER | 标签 ID |

### friend_links（友链表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 站点名称 |
| url | TEXT | 站点链接 |
| avatar | TEXT | 头像 URL |
| description | TEXT | 描述 |
| status | TEXT | 状态：pending/approved/rejected |
| email | TEXT | 联系邮箱 |
| site_name | TEXT | 网站名称 |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

---

## 十二、常见问题

### Q1: 如何切换回静态模式？

修改 `astro.config.mjs`：

```javascript
export default defineConfig({
  output: "static",
  // 移除 adapter 配置
});
```

### Q2: 如何使用 ISR（增量静态再生）？

Astro Cloudflare 适配器支持 ISR，可以在页面中设置：

```astro
---
export const prerender = false;
export const revalidate = 3600; // 1小时后重新生成
---
```

### Q3: 图片如何上传到 R2？

可以创建一个管理后台，或者使用 Cloudflare Dashboard 手动上传。图片访问路径为 `/images/文件名`。

### Q4: 如何添加管理后台？

可以参考 flare-stack-blog 的管理后台实现，或者使用第三方 CMS。

---

## 十三、参考资料

- [Astro Cloudflare 适配器文档](https://docs.astro.build/zh-cn/guides/integrations-guide/cloudflare/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [flare-stack-blog 项目](https://github.com/flare-stack/flare-stack-blog)
