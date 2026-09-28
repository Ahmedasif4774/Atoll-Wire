import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ArticlePageClient from "@/components/dv/ArticlePageClient";
import { getAllArticles, getArticle, getRecentArticles, getRelatedArticles } from "@/lib/data";
import { SITE_URL } from "@/lib/siteUrl";

// Server Component wrapper (needed for generateStaticParams) — see the
// comment at the top of components/dv/ArticlePageClient.tsx for why the
// actual page markup lives there instead of here.
export async function generateStaticParams() {
  const articles = await getAllArticles("dv");
  return articles.map((a) => ({ slug: a.slug }));
}

// Without this, sharing an article link (Facebook, X, WhatsApp, iMessage...)
// produces a bare URL with no title/image — link-preview scrapers read these
// Open Graph/Twitter tags, not the rendered page. Added specifically so the
// Facebook auto-post webhook's plain `link` posts get a proper preview card.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle("dv", params.slug);
  if (!article) return {};

  const url = `${SITE_URL}/article/${article.slug}`;
  return {
    title: article.title,
    description: article.dek || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.dek || undefined,
      url,
      siteName: "AtollWire",
      type: "article",
      images: article.heroImage?.url ? [{ url: article.heroImage.url, alt: article.heroImage.alt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.dek || undefined,
      images: article.heroImage?.url ? [article.heroImage.url] : undefined,
    },
  };
}

export default async function DvArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle("dv", params.slug);
  if (!article) notFound();

  const [recent, related] = await Promise.all([
    getRecentArticles("dv", article.slug, 4),
    getRelatedArticles("dv", article.slug, 4),
  ]);

  return <ArticlePageClient article={article} recent={recent} related={related} />;
}
