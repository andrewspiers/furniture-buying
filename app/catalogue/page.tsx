import { getRealBalance, getSearchIndexProducts } from "@/lib/cognitivoApi";
import ProductCatalogue from "@/components/ProductCatalogue";

export default async function CataloguePage() {
  const [productsResult, balanceResult] = await Promise.all([
    getSearchIndexProducts().then(
      (products) => ({
        products: products
          .map((p) => ({
            itemId: p.item_id,
            name: p.product_name,
            category: p.category ?? "Uncategorized",
            price: p.price,
          }))
          .sort((a, b) => a.category.localeCompare(b.category)),
        error: null as string | null,
      }),
      () => ({
        products: [],
        error:
          "Couldn't load the catalogue from the furniture shop API. Try refreshing.",
      })
    ),
    getRealBalance().then(
      (balance) => ({ balance, error: null as string | null }),
      () => ({
        balance: null,
        error:
          "Couldn't load your balance from the furniture shop API. Try refreshing.",
      })
    ),
  ]);

  return (
    <ProductCatalogue
      products={productsResult.products}
      productsError={productsResult.error}
      remainingBudget={balanceResult.balance}
      balanceError={balanceResult.error}
    />
  );
}
