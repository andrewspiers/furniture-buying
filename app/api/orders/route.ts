import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRealBalance, getSearchIndexProducts } from "@/lib/cognitivoApi";

type OrderItemInput = { itemId: string; quantity: number };

async function handlePost(request: Request) {
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

  // Prices are always re-verified against the live catalogue — never trust
  // a price from the browser.
  let catalogue;
  try {
    catalogue = await getSearchIndexProducts();
  } catch {
    return NextResponse.json(
      { error: "Couldn't verify prices with the furniture shop API. Try again." },
      { status: 502 }
    );
  }
  const catalogueByItemId = new Map(catalogue.map((p) => [p.item_id, p]));

  // Orders still need a local Product row to satisfy the OrderItem->Product
  // foreign key. Most items already have one (from the earlier MongoDB
  // catalogue import); for any that don't, create one on the fly from the
  // live catalogue entry rather than failing the order.
  const existingProducts = await prisma.product.findMany({
    where: { sourceId: { in: wanted.map((item) => item.itemId) } },
    select: { id: true, sourceId: true },
  });
  const localBySourceId = new Map(
    existingProducts.map((product) => [product.sourceId, product])
  );

  let total = 0;
  const orderItemsData = [];
  for (const item of wanted) {
    const catalogueEntry = catalogueByItemId.get(item.itemId);
    if (!catalogueEntry) {
      return NextResponse.json(
        {
          code: "PRODUCT_NOT_FOUND",
          error: "This item is no longer available.",
        },
        { status: 404 }
      );
    }

    let localProduct = localBySourceId.get(item.itemId);
    if (!localProduct) {
      localProduct = await prisma.product.create({
        data: {
          sourceId: catalogueEntry.item_id,
          name: catalogueEntry.product_name,
          description: catalogueEntry.category ?? "Uncategorized",
          price: catalogueEntry.price,
          category: catalogueEntry.category ?? "Uncategorized",
        },
        select: { id: true, sourceId: true },
      });
      localBySourceId.set(item.itemId, localProduct);
    }

    total += catalogueEntry.price * item.quantity;
    orderItemsData.push({
      productId: localProduct.id,
      quantity: item.quantity,
      unitPrice: catalogueEntry.price,
    });
  }

  let remaining: number;
  try {
    remaining = await getRealBalance();
  } catch {
    return NextResponse.json(
      { error: "Couldn't check your balance with the furniture shop API. Try again." },
      { status: 502 }
    );
  }

  if (total > remaining) {
    return NextResponse.json(
      {
        code: "INSUFFICIENT_BALANCE",
        error: `Insufficient balance: this order costs $${total.toFixed(
          2
        )} but you only have $${remaining.toFixed(2)} available.`,
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

export async function POST(request: Request) {
  try {
    return await handlePost(request);
  } catch (err) {
    // Whatever went wrong (bad request body, an unexpected DB error, etc.),
    // always return valid JSON — the client always expects one, and an
    // unhandled crash here would otherwise surface as a raw error page that
    // breaks the client's res.json() call.
    console.error("POST /api/orders failed:", err);
    return NextResponse.json(
      { error: "Something went wrong placing your order. Please try again." },
      { status: 500 }
    );
  }
}
