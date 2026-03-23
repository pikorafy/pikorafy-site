import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getArticleBySlug, getArticleSlugs } from "@/lib/articles";
import NewsletterSignup from "@/components/NewsletterSignup";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return {};

  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    openGraph: {
      title: article.frontmatter.title,
      description: article.frontmatter.description,
      type: "article",
      publishedTime: article.frontmatter.date,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const { frontmatter, content, readingTime } = article;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    datePublished: frontmatter.date,
    author: {
      "@type": "Organization",
      name: "Pikorafy",
      url: "https://pikorafy.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Pikorafy",
      url: "https://pikorafy.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://pikorafy.com/blog/${frontmatter.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://pikorafy.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://pikorafy.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: frontmatter.title,
        item: `https://pikorafy.com/blog/${frontmatter.slug}`,
      },
    ],
  };

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[#8b8fa3] hover:text-[#e4e6eb] transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to blog
        </Link>

        {/* Article header */}
        <header className="mt-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-500">
              {frontmatter.category}
            </span>
            <time className="text-sm text-[#8b8fa3]">{frontmatter.date}</time>
            <span className="text-sm text-[#8b8fa3]">
              {readingTime} min read
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            {frontmatter.description}
          </p>
        </header>

        {/* Divider */}
        <div className="mt-8 border-t border-[#2a2e3a]" />

        {/* Article content */}
        <article className="mt-8 prose-custom">
          <MDXRemote source={content} />
        </article>

        {/* Tags */}
        {frontmatter.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2">
            {frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-2.5 py-1 text-xs text-[#8b8fa3]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Newsletter signup */}
        <div className="mt-16 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-8">
          <h3 className="text-lg font-semibold text-[#e4e6eb]">
            Stay up to date
          </h3>
          <p className="mt-2 text-sm text-[#8b8fa3]">
            Get the latest articles on AI tools, SaaS comparisons, and developer
            productivity delivered to your inbox.
          </p>
          <div className="mt-4">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </div>
  );
}
