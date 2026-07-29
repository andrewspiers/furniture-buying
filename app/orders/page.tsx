import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrdersView from "@/components/OrdersView";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
    },
  });

  const spent = user.orders.reduce((sum, order) => sum + order.total, 0);
  const remaining = user.budget - spent;

  return (
    <OrdersView
      budget={user.budget}
      spent={spent}
      remaining={remaining}
      orders={user.orders.map((order) => ({
        id: order.id,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          product: { name: item.product.name },
        })),
      }))}
    />
  );
}
