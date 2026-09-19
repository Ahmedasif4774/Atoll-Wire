import { notFound } from "next/navigation";
import CategoryPageClient from "@/components/en/CategoryPageClient";
import { getArticlesByCategory, getCategories, getCategory } from "@/lib/data";
import { getPopularSidebarArticles } from "@/lib/popular";

// Server Component wrapper (needed for generateStaticParams) — see the
// comment at the top of components/en/CategoryPageClient.tsx for why the
// actual page markup lives there instead of here. getCategories() is still
// synchronous (categories are plain local data, not Sanity-backed), so this
// doesn't need to be async.
export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export default async function EnCategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) notFound();

  const [articles, popular] = await Promise.all([
    getArticlesByCategory("en", category.slug),
    getPopularSidebarArticles("en"),
  ]);

  return <CategoryPageClient category={category} articles={articles} popular={popular} />;
}
