import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    name: "Oakwood Dining Table",
    description: "Solid oak dining table, seats 6.",
    price: 899,
    imageUrl: "https://placehold.co/400x300?text=Dining+Table",
    category: "Dining",
  },
  {
    name: "Linen Sofa",
    description: "3-seater sofa with removable linen cover.",
    price: 1249,
    imageUrl: "https://placehold.co/400x300?text=Sofa",
    category: "Living Room",
  },
  {
    name: "Walnut Bookshelf",
    description: "5-tier bookshelf in walnut veneer.",
    price: 349,
    imageUrl: "https://placehold.co/400x300?text=Bookshelf",
    category: "Storage",
  },
  {
    name: "Ergonomic Office Chair",
    description: "Adjustable height and lumbar support.",
    price: 279,
    imageUrl: "https://placehold.co/400x300?text=Office+Chair",
    category: "Office",
  },
  {
    name: "Queen Bed Frame",
    description: "Upholstered queen bed frame with headboard.",
    price: 599,
    imageUrl: "https://placehold.co/400x300?text=Bed+Frame",
    category: "Bedroom",
  },
  {
    name: "Marble-Top Coffee Table",
    description: "Round coffee table with marble top, steel legs.",
    price: 429,
    imageUrl: "https://placehold.co/400x300?text=Coffee+Table",
    category: "Living Room",
  },
  {
    name: "Rattan Accent Chair",
    description: "Handwoven rattan accent chair with cushion.",
    price: 199,
    imageUrl: "https://placehold.co/400x300?text=Accent+Chair",
    category: "Living Room",
  },
  {
    name: "Standing Desk",
    description: "Electric height-adjustable standing desk.",
    price: 649,
    imageUrl: "https://placehold.co/400x300?text=Standing+Desk",
    category: "Office",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      name: "Demo Buyer",
      email: "buyer@example.com",
      passwordHash,
      budget: 2000,
    },
  });

  for (const product of PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    if (!existing) {
      await prisma.product.create({ data: product });
    }
  }

  console.log("Seed complete. Login with buyer@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
