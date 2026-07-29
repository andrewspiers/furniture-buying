import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBudgetSummary } from "@/lib/budget";
import ProductCatalogue from "@/components/ProductCatalogue";

export default async function CataloguePage() {
  const session = await auth();
  const userId = session!.user.id;

  const [products, { remaining }] = await Promise.all([
    prisma.product.findMany({ orderBy: { category: "asc" } }),
    getBudgetSummary(userId),
  ]);

  return <ProductCatalogue products={products} remainingBudget={remaining} />;
}
