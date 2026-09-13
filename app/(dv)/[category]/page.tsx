import { notFound } from "next/navigation";
import CategoryPageClient from "@/components/dv/CategoryPageClient";
import { getArticlesByCategory, getCategories, getCategory } from "@/lib/data";
import { getPopularSidebarArticles } from "@/lib/popular";

// This file stays a Server Component (generateStaticParams requires that)
// and only does the data lookup. All the actual page markup/styling lives
// in CategoryPageClient — see the comment at the top of that file for why.
export function generateStaticParams() {
  return getCategories().map((c) => ({ category: c.slug }));
}

export default function DvCategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) notFound();

  const articles = getArticlesByCategory("dv", category.slug);
  const popular = getPopularSidebarArticles("dv");

  return <CategoryPageClient category={category} articles={articles} popular={popular} />;
}
