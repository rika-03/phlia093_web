import { marked } from "marked";

export interface RenderedContent {
  Content: any; // Astro 组件格式，这里用 HTML 字符串代替
  html: string;
  headings: { depth: number; text: string; slug: string }[];
  remarkPluginFrontmatter: {
    words: number;
    minutes: number;
  };
}

export async function renderMarkdown(
  content: string,
): Promise<RenderedContent> {
  // 渲染 Markdown 为 HTML
  const html = await marked.parse(content);

  // 提取标题
  const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/g;
  const headings: { depth: number; text: string; slug: string }[] = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      depth: parseInt(match[1], 10),
      slug: match[2],
      text: match[3].replace(/<[^>]*>/g, ""), // 移除 HTML 标签
    });
  }

  // 统计字数（中文按字符，英文按单词）
  const plainText = content
    .replace(/[#*`>\-\[\]()!_~]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = plainText
    .replace(/[\u4e00-\u9fa5]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const words = chineseChars + englishWords;

  // 估算阅读时间（按每分钟 200 字/词计算）
  const minutes = Math.max(1, Math.ceil(words / 200));

  return {
    Content: null, // 简化版本，直接用 HTML
    html,
    headings,
    remarkPluginFrontmatter: {
      words,
      minutes,
    },
  };
}
