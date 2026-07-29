import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getBudgetSummary } from "@/lib/budget";

type OrderItemInput = { productId: string; quantity: number };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const items: OrderItemInput[] = Array.isArray(body?.items) ? body.items : [];
  const wanted = items.filter((item) => item.quantity > 0);

  if (wanted.length === 0) {
    return NextResponse.json(
      { error: "Select at least one item to order." },
      { status: 400 }
    );
  }

  const products = await prisma.product.findMany({
    where: { id: { in: wanted.map((item) => item.productId) } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  let total = 0;
  const orderItemsData = wanted.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error(`Unknown product: ${item.productId}`);
    }
    total += product.price * item.quantity;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  const { remaining } = await getBudgetSummary(session.user.id);

  if (total > remaining) {
    return NextResponse.json(
      {
        error: `This order ($${total.toFixed(
          2
        )}) exceeds your remaining budget of $${remaining.toFixed(2)}.`,
      },
      { status: 400 }
    );
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      total,
      items: { create: orderItemsData },
    },
  });

  return NextResponse.json({ orderId: order.id });
}
