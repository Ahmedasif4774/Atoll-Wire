import { notFound } from "next/navigation";
import ArticlePageClient from "@/components/en/ArticlePageClient";
import { getAllArticles, getArticle, getRecentArticles, getRelatedArticles } from "@/lib/data";

// Server Component wrapper (needed for generateStaticParams) — see the
// comment at the top of components/en/ArticlePageClient.tsx for why the
// actual page markup lives there instead of here.
export async function generateStaticParams() {
  const articles = await getAllArticles("en");
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function EnArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle("en", params.slug);
  if (!article) notFound();

  const [recent, related] = await Promise.all([
    getRecentArticles("en", article.slug, 4),
    getRelatedArticles("en", article.slug, 4),
  ]);

  return <ArticlePageClient article={article} recent={recent} related={related} />;
}
