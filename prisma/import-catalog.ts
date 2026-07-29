import "dotenv/config";
import { MongoClient } from "mongodb";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CatalogDoc = {
  item_id?: string;
  product_name?: string;
  category?: string;
  price?: number;
  colours?: string[];
  width?: number | null;
  depth?: number | null;
  height?: number | null;
  link?: string;
  image_url?: string; // base64-encoded image bytes, not an actual URL
  image_mime_type?: string;
};

function buildDescription(doc: CatalogDoc): string {
  const parts: string[] = [];

  if (doc.colours?.length) {
    parts.push(`Available in ${doc.colours.join(", ")}`);
  }

  const dims = [doc.width, doc.depth, doc.height].filter(
    (n): n is number => typeof n === "number"
  );
  if (dims.length) {
    parts.push(`Dimensions (W x D x H): ${dims.join(" x ")} cm`);
  }

  if (parts.length === 0) {
    parts.push(doc.category ?? "Furniture");
  }

  return parts.join(". ") + ".";
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set (check your .env file).");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  const docs = (await client
    .db()
    .collection<CatalogDoc>("catalog")
    .find()
    .toArray());

  console.log(`Fetched ${docs.length} products from MongoDB.`);

  let imported = 0;
  let skipped = 0;

  for (const doc of docs) {
    if (!doc.item_id || !doc.product_name || typeof doc.price !== "number") {
      skipped++;
      continue;
    }

    const image = doc.image_url ? Buffer.from(doc.image_url, "base64") : null;

    await prisma.product.upsert({
      where: { sourceId: doc.item_id },
      update: {
        name: doc.product_name,
        description: buildDescription(doc),
        price: doc.price,
        category: doc.category ?? "Uncategorized",
        image,
        imageMimeType: doc.image_mime_type ?? null,
        sourceUrl: doc.link ?? null,
      },
      create: {
        sourceId: doc.item_id,
        name: doc.product_name,
        description: buildDescription(doc),
        price: doc.price,
        category: doc.category ?? "Uncategorized",
        image,
        imageMimeType: doc.image_mime_type ?? null,
        sourceUrl: doc.link ?? null,
      },
    });
    imported++;
  }

  await client.close();

  // Remove the old hand-written placeholder products (they have no sourceId,
  // since they didn't come from this import) — but keep any that already
  // appear in a real order, so past order history stays intact.
  const removed = await prisma.product.deleteMany({
    where: { sourceId: null, orderItems: { none: {} } },
  });
  const keptForHistory = await prisma.product.count({
    where: { sourceId: null },
  });

  console.log(
    `Imported/updated ${imported} products, skipped ${skipped} malformed docs, ` +
      `removed ${removed.count} placeholder products` +
      (keptForHistory > 0
        ? `, kept ${keptForHistory} placeholder product(s) referenced by past orders.`
        : ".")
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
