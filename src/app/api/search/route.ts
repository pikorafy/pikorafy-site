import { NextRequest, NextResponse } from "next/server";
import { getAllArticles } from "@/lib/articles";
import { getAllComparisons } from "@/lib/comparisons";
import { getAllAlternatives } from "@/lib/alternatives";

interface SearchResult {
  title: string;
  description: string;
  url: string;
  type: "Article" | "Comparison" | "Alternative" | "Tool";
}

const tools = [
  {
    title: "JSON Formatter",
    description: "Format, validate, and minify JSON data with syntax highlighting.",
    slug: "json-formatter",
    category: "Data",
  },
  {
    title: "Password Generator",
    description: "Generate strong, secure passwords with customizable rules.",
    slug: "password-generator",
    category: "Security",
  },
  {
    title: "Base64 Encoder / Decoder",
    description: "Encode and decode Base64 strings for data transfer.",
    slug: "base64",
    category: "Encoding",
  },
  {
    title: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and other color formats.",
    slug: "color-converter",
    category: "Design",
  },
  {
    title: "Text Diff",
    description: "Compare two blocks of text and see differences highlighted.",
    slug: "text-diff",
    category: "Text",
  },
  {
    title: "UUID Generator",
    description: "Generate UUID v4 identifiers on the fly.",
    slug: "uuid-generator",
    category: "Data",
  },
  {
    title: "Regex Tester",
    description: "Test and debug regular expressions with live matching.",
    slug: "regex-tester",
    category: "Text",
  },
  {
    title: "JWT Decoder",
    description: "Decode and inspect JSON Web Token payloads.",
    slug: "jwt-decoder",
    category: "Security",
  },
  {
    title: "CSS Minifier",
    description: "Minify CSS files to reduce payload size.",
    slug: "css-minifier",
    category: "Code",
  },
  {
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and other hash digests.",
    slug: "hash-generator",
    category: "Security",
  },
  {
    title: "Lorem Ipsum Generator",
    description: "Generate placeholder text for designs and prototypes.",
    slug: "lorem-ipsum",
    category: "Text",
  },
  {
    title: "URL Encoder",
    description: "Encode and decode URLs for safe data transmission.",
    slug: "url-encoder",
    category: "Encoding",
  },
  {
    title: "Meta Tag Generator",
    description: "Generate SEO meta tags, Open Graph, and Twitter Cards with live preview.",
    slug: "meta-tag-generator",
    category: "SEO",
  },
  {
    title: "Word Counter",
    description: "Count words, characters, sentences, paragraphs, and estimate reading time.",
    slug: "word-counter",
    category: "Text",
  },
  {
    title: "Image Compressor",
    description: "Compress images client-side with adjustable quality. No uploads needed.",
    slug: "image-compressor",
    category: "Media",
  },
  {
    title: "QR Code Generator",
    description: "Generate QR codes from text or URLs and download as SVG.",
    slug: "qr-code-generator",
    category: "Data",
  },
  {
    title: "CSS Gradient Generator",
    description: "Build beautiful CSS gradients visually and copy the code.",
    slug: "css-gradient-generator",
    category: "Design",
  },
  {
    title: "Markdown Preview",
    description: "Write Markdown and see a live rendered preview side by side.",
    slug: "markdown-preview",
    category: "Text",
  },
  {
    title: "HTML Entity Encoder",
    description: "Encode and decode HTML entities for safe embedding.",
    slug: "html-entity-encoder",
    category: "Encoding",
  },
  {
    title: "SVG to PNG Converter",
    description: "Convert SVG files to PNG images at any resolution.",
    slug: "svg-to-png",
    category: "Media",
  },
  {
    title: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates.",
    slug: "timestamp-converter",
    category: "Data",
  },
  {
    title: "JSON to CSV",
    description: "Convert JSON arrays to CSV format for spreadsheets.",
    slug: "json-to-csv",
    category: "Data",
  },
];

function matchesQuery(query: string, ...fields: string[]): boolean {
  const lower = query.toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(lower));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const results: SearchResult[] = [];

  // Search articles
  const articles = getAllArticles();
  for (const article of articles) {
    const { title, description, tags, slug } = article.frontmatter;
    if (matchesQuery(query, title, description, ...tags)) {
      results.push({
        title,
        description,
        url: `/blog/${slug}`,
        type: "Article",
      });
    }
  }

  // Search comparisons
  const comparisons = getAllComparisons();
  for (const comparison of comparisons) {
    const { title, description, tags, slug, toolA, toolB } = comparison.frontmatter;
    if (matchesQuery(query, title, description, ...tags, toolA, toolB)) {
      results.push({
        title,
        description,
        url: `/vs/${slug}`,
        type: "Comparison",
      });
    }
  }

  // Search alternatives
  const alternatives = getAllAlternatives();
  for (const alternative of alternatives) {
    const { title, description, tags, slug, toolName } = alternative.frontmatter;
    if (matchesQuery(query, title, description, ...tags, toolName)) {
      results.push({
        title,
        description,
        url: `/alternatives/${slug}`,
        type: "Alternative",
      });
    }
  }

  // Search tools
  for (const tool of tools) {
    if (matchesQuery(query, tool.title, tool.description, tool.category)) {
      results.push({
        title: tool.title,
        description: tool.description,
        url: `/tools/${tool.slug}`,
        type: "Tool",
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
