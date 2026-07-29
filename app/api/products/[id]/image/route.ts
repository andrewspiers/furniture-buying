import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { image: true, imageMimeType: true },
  });

  if (!product?.image) {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }

  return new NextResponse(product.image, {
    headers: {
      "Content-Type": product.imageMimeType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
