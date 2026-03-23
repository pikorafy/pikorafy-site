import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  getAlternativeBySlug,
  getAlternativeSlugs,
} from "@/lib/alternatives";
import NewsletterSignup from "@/components/NewsletterSignup";
import ArticleReader from "@/components/ArticleReader";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAlternativeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const alternative = getAlternativeBySlug(slug);

  if (!alternative) return {};

  return {
    title: alternative.frontmatter.title,
    description: alternative.frontmatter.description,
    openGraph: {
      title: alternative.frontmatter.title,
      description: alternative.frontmatter.description,
      type: "article",
    },
  };
}

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params;
  const alternative = getAlternativeBySlug(slug);

  if (!alternative) notFound();

  const { frontmatter, content, readingTime } = alternative;

  return (
    <div className="bg-[#0f1117] min-h-full py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/alternatives"
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
          All alternatives
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

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-lg font-bold text-blue-500">
              {frontmatter.toolName.charAt(0)}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#e4e6eb] sm:text-4xl">
              {frontmatter.title}
            </h1>
          </div>
          <p className="mt-4 text-lg text-[#8b8fa3]">
            {frontmatter.description}
          </p>

          {/* Top alternatives badges */}
          {frontmatter.topAlternatives.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {frontmatter.topAlternatives.map((alt) => (
                <span
                  key={alt}
                  className="inline-flex rounded-md border border-[#2a2e3a] bg-[#1a1d27] px-2.5 py-1 text-xs text-[#8b8fa3]"
                >
                  {alt}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Divider */}
        <div className="mt-8 border-t border-[#2a2e3a]" />

        {/* Audio reader */}
        <div className="mt-6">
          <ArticleReader />
        </div>

        {/* Content */}
        <article className="mt-8 prose-custom">
          <MDXRemote source={content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
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
            Get notified when we add new alternatives and reviews.
          </p>
          <div className="mt-4">
            <NewsletterSignup />
          </div>
        </div>
      </div>
    </div>
  );
}
