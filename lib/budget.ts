import { prisma } from "@/lib/db";

export async function getBudgetSummary(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { orders: true },
  });

  const spent = user.orders.reduce((sum, order) => sum + order.total, 0);
  const remaining = user.budget - spent;

  return { budget: user.budget, spent, remaining };
}
