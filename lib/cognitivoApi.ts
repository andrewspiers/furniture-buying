const BASE_URL = process.env.COGNITIVO_BASE_URL;
const API_KEY = process.env.COGNITIVO_API_KEY;
const USER_ID = process.env.COGNITIVO_USERNAME;

// The balance endpoint has been observed taking several seconds under load
// (it's derived by summing ledger entries, not a stored field) — give it
// room before giving up.
const BALANCE_TIMEOUT_MS = 15_000;

export async function getRealBalance(): Promise<number> {
  if (!BASE_URL || !API_KEY || !USER_ID) {
    throw new Error(
      "Cognitivo API is not configured (COGNITIVO_BASE_URL / COGNITIVO_API_KEY / COGNITIVO_USERNAME)."
    );
  }

  const res = await fetch(`${BASE_URL.replace(/\/$/, "")}/users/${USER_ID}`, {
    headers: { "x-api-key": API_KEY },
    cache: "no-store",
    signal: AbortSignal.timeout(BALANCE_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Cognitivo balance request failed: ${res.status}`);
  }

  const data: { balance: number } = await res.json();
  return data.balance;
}

export type CatalogueProduct = {
  item_id: string;
  product_name: string;
  price: number;
  category: string | null;
};

// search-index is the lightweight listing endpoint meant for browsing —
// no images, fast. The plain GET /catalogue endpoint returns full images
// for every product and has been observed to hang indefinitely; don't use
// it for browsing (see api-testing/get-catalogue.sh, which needs a
// --max-time to avoid hanging).
const SEARCH_INDEX_TIMEOUT_MS = 15_000;

export async function getSearchIndexProducts(): Promise<CatalogueProduct[]> {
  if (!BASE_URL) {
    throw new Error("Cognitivo API is not configured (COGNITIVO_BASE_URL).");
  }

  const res = await fetch(
    `${BASE_URL.replace(/\/$/, "")}/catalogue/search-index`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(SEARCH_INDEX_TIMEOUT_MS),
    }
  );

  if (!res.ok) {
    throw new Error(`Cognitivo search-index request failed: ${res.status}`);
  }

  return res.json();
}
