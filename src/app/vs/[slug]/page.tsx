import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { existsSync } from "fs";
import { join } from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getComparisonBySlug, getComparisonSlugs } from "@/lib/comparisons";
import NewsletterSignup from "@/components/NewsletterSignup";
import RelatedArticles from "@/components/RelatedArticles";
import ArticleReader from "@/components/ArticleReader";
import VPNPricingDemo from "@/components/VPNPricingDemo";
import ToolLogo from "@/components/ToolLogo";

const mdxComponents = {
  VPNPricingDemo,
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getComparisonSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) return {};

  const ogImage = `/og/${slug}.png`;

  return {
    title: `${comparison.frontmatter.title} - Comparison`,
    description: comparison.frontmatter.description,
    openGraph: {
      title: comparison.frontmatter.title,
      description: comparison.frontmatter.description,
      type: "article",
      images: [
        {
          url: `https://pikorafy.com${ogImage}`,
          width: 1200,
          height: 675,
          alt: comparison.frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: comparison.frontmatter.title,
      description: comparison.frontmatter.description,
      images: [`https://pikorafy.com${ogImage}`],
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);

  if (!comparison) notFound();

  const { frontmatter, content, readingTime } = comparison;
  const hasOgImage = existsSync(join(process.cwd(), "public", "og", `${slug}.png`));

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
      "@id": `https://pikorafy.com/vs/${frontmatter.slug}`,
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
        name: "Comparisons",
        item: "https://pikorafy.com/vs",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: frontmatter.title,
        item: `https://pikorafy.com/vs/${frontmatter.slug}`,
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
          href="/vs"
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
          All comparisons
        </Link>

        {/* Header */}
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

          {/* VS hero */}
          {hasOgImage ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#2a2e3a]">
              <Image
                src={`/og/${slug}.png`}
                alt={`${frontmatter.toolA} vs ${frontmatter.toolB}`}
                width={1200}
                height={675}
                className="w-full h-auto"
                priority
              />
            </div>
          ) : (
            <div className="mt-6 relative overflow-hidden rounded-2xl border border-[#2a2e3a] bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 p-8">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <pattern id="vs-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#3B82F6" opacity="0.07" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#vs-dots)" />
              </svg>
              <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="relative flex items-center justify-center gap-6 sm:gap-10">
                <div className="flex flex-col items-center gap-2">
                  <ToolLogo name={frontmatter.toolA} size={40} />
                  <span className="text-sm font-medium text-[#e4e6eb]">{frontmatter.toolA}</span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xs font-bold text-blue-400">VS</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <ToolLogo name={frontmatter.toolB} size={40} />
                  <span className="text-sm font-medium text-[#e4e6eb]">{frontmatter.toolB}</span>
                </div>
              </div>
            </div>
          )}

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
            {frontmatter.title}
          </h1>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            {frontmatter.description}
          </p>
        </header>

        {/* Divider */}
        <div className="mt-8 border-t border-[#2a2e3a]" />

        {/* Audio reader */}
        <div className="mt-6">
          <ArticleReader />
        </div>

        {/* Content */}
        <article className="mt-8 prose-custom">
          <MDXRemote source={content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
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

        {/* Related articles */}
        <RelatedArticles
          currentSlug={frontmatter.slug}
          category={frontmatter.category}
          tags={frontmatter.tags}
          type="vs"
        />

        {/* Newsletter signup */}
        <div className="mt-16 rounded-xl border border-[#2a2e3a] bg-[#1a1d27] p-8">
          <h3 className="text-lg font-semibold text-[#e4e6eb]">
            Stay up to date
          </h3>
          <p className="mt-2 text-sm text-[#8b8fa3]">
            Get notified when we publish new comparisons and reviews.
          </p>
          <div className="mt-4">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </div>
  );
}
