export function productImageSrc(product: { id: string; imageUrl: string | null }) {
  return product.imageUrl ?? `/api/products/${product.id}/image`;
}
