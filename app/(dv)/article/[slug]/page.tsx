import { notFound } from "next/navigation";
import ArticlePageClient from "@/components/dv/ArticlePageClient";
import { getAllArticles, getArticle, getRecentArticles, getRelatedArticles } from "@/lib/data";

// Server Component wrapper (needed for generateStaticParams) — see the
// comment at the top of components/dv/ArticlePageClient.tsx for why the
// actual page markup lives there instead of here.
export async function generateStaticParams() {
  const articles = await getAllArticles("dv");
  return articles.map((a) => ({ slug: a.slug }));
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
