# 页面改造指南

本文档说明如何将 Mizuki 的页面从 Content Collections（Markdown 文件）改造为从 Cloudflare D1 数据库获取数据。

## 核心概念

### 原来的方式（静态）

```astro
---
import { getSortedPosts } from "../utils/content-utils";

const posts = await getSortedPosts();
---
```

### 新的方式（动态/SSR）

```astro
---
import { getDbFromLocals } from "../lib/cloudflare";
import { getSortedPosts } from "../lib/data/posts";

const db = getDbFromLocals(Astro.locals);
const posts = await getSortedPosts(db);
---
```

---

## 示例：改造首页文章列表

### 原文件：`src/pages/[...page].astro`

```astro
---
import Pagination from "@components/control/Pagination.astro";
import CategoryBar from "@components/features/posts/CategoryBar.astro";
import PostPage from "@components/features/posts/PostPage.astro";
import MainGridLayout from "@layouts/MainGridLayout.astro";
import type { GetStaticPaths } from "astro";

import { siteConfig } from "../config";
import { PAGE_SIZE } from "../constants/constants";
import { getSortedPosts } from "../utils/content-utils";
import { initPostIdMap } from "../utils/permalink-utils";

const showCategoryBar = siteConfig.postListLayout.categoryBar?.enable ?? false;

export const getStaticPaths = (async ({ paginate }) => {
	const allBlogPosts = await getSortedPosts();
	// 初始化文章 ID 映射（用于 permalink 功能）
	initPostIdMap(allBlogPosts);
	return paginate(allBlogPosts, { pageSize: PAGE_SIZE });
}) satisfies GetStaticPaths;

const { page } = Astro.props;

const len = page.data.length;
---

<MainGridLayout>
	{showCategoryBar && <CategoryBar />}
	<PostPage page={page} />
	<Pagination
		class="mx-auto onload-animation"
		page={page}
		style={`animation-delay: calc(var(--content-delay) + ${len * 50}ms)`}
	/>
</MainGridLayout>
```

### 改造后（使用数据库）

```astro
---
import Pagination from "@components/control/Pagination.astro";
import CategoryBar from "@components/features/posts/CategoryBar.astro";
import PostPage from "@components/features/posts/PostPage.astro";
import MainGridLayout from "@layouts/MainGridLayout.astro";

import { siteConfig } from "../config";
import { PAGE_SIZE } from "../constants/constants";
import { getDbFromLocals } from "../lib/cloudflare";
import { getSortedPosts } from "../lib/data/posts";
import { withCache } from "../lib/kv";

const showCategoryBar = siteConfig.postListLayout.categoryBar?.enable ?? false;

// 从 locals 获取数据库连接
const db = getDbFromLocals(Astro.locals);
const kv = Astro.locals.runtime.env.KV;

// 获取文章列表（带缓存）
const allBlogPosts = await withCache(
  kv,
  "posts:sorted",
  () => getSortedPosts(db),
  3600, // 缓存 1 小时
);

// 简单分页（示例）
const pageNum = Number(Astro.params.page?.[0] || 1);
const startIndex = (pageNum - 1) * PAGE_SIZE;
const endIndex = startIndex + PAGE_SIZE;
const pagePosts = allBlogPosts.slice(startIndex, endIndex);

// 构造分页对象（适配原有组件）
const page = {
  data: pagePosts,
  currentPage: pageNum,
  lastPage: Math.ceil(allBlogPosts.length / PAGE_SIZE),
  size: PAGE_SIZE,
  total: allBlogPosts.length,
  url: {
    current: pageNum === 1 ? "/" : `/page/${pageNum}/`,
    next: pageNum < Math.ceil(allBlogPosts.length / PAGE_SIZE) ? `/page/${pageNum + 1}/` : undefined,
    prev: pageNum > 1 ? (pageNum === 2 ? "/" : `/page/${pageNum - 1}/`) : undefined,
  },
};

const len = page.data.length;
---

<MainGridLayout>
	{showCategoryBar && <CategoryBar />}
	<PostPage page={page} />
	<Pagination
		class="mx-auto onload-animation"
		page={page}
		style={`animation-delay: calc(var(--content-delay) + ${len * 50}ms)`}
	/>
</MainGridLayout>
```

---

## 示例：改造文章详情页

### 原文件：`src/pages/posts/[...slug].astro`

```astro
---
import PostLayout from "@layouts/PostLayout.astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("posts");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<PostLayout post={post}>
  <Content />
</PostLayout>
```

### 改造后（使用数据库）

```astro
---
import PostLayout from "@layouts/PostLayout.astro";
import { getDbFromLocals } from "../../lib/cloudflare";
import { getPostBySlugWithPrevNext } from "../../lib/data/db-content-utils";
import { withCache } from "../../lib/kv";

const slug = Astro.params.slug?.join("/") || "";

const db = getDbFromLocals(Astro.locals);
const kv = Astro.locals.runtime.env.KV;

// 获取文章（带缓存）
const post = await withCache(
  kv,
  `post:${slug}`,
  () => getPostBySlugWithPrevNext(db, slug),
  3600,
);

if (!post) {
  return Astro.redirect("/404");
}

// 注意：数据库中的内容是 Markdown 格式
// 需要使用 Astro 的 Markdown 组件渲染
// 或者使用 marked/markdown-it 等库渲染
---

<PostLayout post={post}>
  <!-- 这里需要根据你的渲染方式来显示内容 -->
  <!-- 方案一：使用 Astro 的 Markdown 组件 -->
  <!-- 方案二：在服务端渲染成 HTML -->
  <article class="prose">
    <ContentRenderer content={post.body} />
  </article>
</PostLayout>
```

---

## 数据格式转换说明

### 数据库 Post 格式

```typescript
interface PostForList {
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
```

### Content Collection 格式

```typescript
interface CollectionEntry<"posts"> {
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
    // ... 其他字段
  };
  render(): Promise<{ Content: AstroComponentFactory }>;
}
```

### 转换函数

我们已经提供了 `db-content-utils.ts` 中的转换函数，可以将数据库格式转换为 Content Collection 格式，方便逐步迁移。

```typescript
import { getSortedPosts } from "../lib/data/db-content-utils";

// 返回的格式和原来的 getCollection 类似
const posts = await getSortedPosts(db);
// posts[0].data.title
// posts[0].body
```

---

## 渐进式迁移方案

建议按以下步骤逐步迁移，避免一次性改动太多：

### 阶段一：基础设施搭建

1. ✅ 添加 Cloudflare 适配器
2. ✅ 创建数据库 schema
3. ✅ 创建数据访问层
4. ✅ 配置 wrangler.toml

### 阶段二：单页面试点

1. 先改造一个简单的页面（如友链页面）
2. 验证数据库连接和数据获取是否正常
3. 测试部署

### 阶段三：核心页面迁移

1. 改造文章列表页
2. 改造文章详情页
3. 改造归档页面
4. 改造标签页面

### 阶段四：其他页面

1. 改造日记页面
2. 改造相册页面
3. 改造番剧页面
4. 等等

### 阶段五：优化

1. 添加 KV 缓存
2. 优化数据库查询
3. 添加 ISR（增量静态再生）
4. 性能优化

---

## 注意事项

### 1. Markdown 渲染

数据库中存储的是 Markdown 文本，渲染方式有几种选择：

**方案 A：服务端渲染成 HTML**
```typescript
import { marked } from "marked";

const html = marked(post.content);
```

**方案 B：客户端渲染**
- 使用 markdown-it 等库在浏览器中渲染

**方案 C：使用 Astro 的 Markdown 组件**
- 需要动态导入，可能比较复杂

推荐使用方案 A，在服务器端渲染成 HTML，性能更好。

### 2. 图片处理

原来的图片可能存储在本地或 CDN，迁移到 R2 后：

- 上传图片到 R2 桶
- 图片访问路径：`/images/文件名`
- 需要在 Cloudflare Pages 中配置 R2 路由

### 3. 缓存策略

建议对以下数据添加 KV 缓存：
- 文章列表（缓存 1 小时）
- 文章详情（缓存 1 小时）
- 标签列表（缓存 24 小时）
- 友链列表（缓存 24 小时）

更新文章时记得清除对应缓存。

### 4. 分页

原来使用 Astro 内置的 `paginate` 函数，使用数据库后需要自己实现分页逻辑。

### 5. 搜索功能

原来使用 pagefind 做静态搜索，使用数据库后可以：
- 继续使用 pagefind（需要定期构建索引）
- 或者使用数据库的 LIKE 查询
- 或者使用 Cloudflare 的 Vectorize 做全文搜索

---

## 常见问题

### Q: 为什么不直接用 flare-stack-blog 的 API？

A: 也可以。如果你已经部署了 flare-stack-blog，可以让 Mizuki 通过 API 获取数据，这样更简单。但这样就变成了两个项目，部署和维护更复杂。

### Q: 数据库的内容怎么管理？

A: 目前需要：
1. 手动写 SQL 插入
2. 或者使用 Drizzle Studio
3. 或者后续开发管理后台

flare-stack-blog 有完整的管理后台，可以考虑复用。

### Q: 性能怎么样？

A: Cloudflare D1 的性能对于博客来说完全足够，加上 KV 缓存后，大部分请求都不会打到数据库。

### Q: 可以混合使用吗？部分页面静态，部分动态？

A: 可以。Astro 支持 hybrid 模式，可以在页面级别设置 `prerender = true` 或 `false`。
