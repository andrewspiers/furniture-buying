import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRealBalance } from "@/lib/cognitivoApi";
import OrdersView from "@/components/OrdersView";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, balanceResult] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: { include: { product: { select: { name: true } } } } },
        },
      },
    }),
    getRealBalance().then(
      (balance) => ({ balance, error: null as string | null }),
      () => ({
        balance: null,
        error: "Couldn't load your balance from the furniture shop API.",
      })
    ),
  ]);

  const spent = user.orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <OrdersView
      spent={spent}
      balance={balanceResult.balance}
      balanceError={balanceResult.error}
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
