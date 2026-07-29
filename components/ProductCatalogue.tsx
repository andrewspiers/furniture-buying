"use client";

import { useMemo, useState } from "react";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

type Product = {
  itemId: string;
  name: string;
  category: string;
  price: number;
};

export default function ProductCatalogue({
  products,
  productsError,
  remainingBudget,
  balanceError,
}: {
  products: Product[];
  productsError?: string | null;
  remainingBudget: number | null;
  balanceError?: string | null;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + product.price * (quantities[product.itemId] ?? 0),
        0
      ),
    [products, quantities]
  );

  // If the real balance couldn't be loaded, don't guess — block ordering
  // rather than risk allowing (or wrongly blocking) a purchase.
  const balanceUnavailable = remainingBudget === null;
  const overBudget = balanceUnavailable || total > remainingBudget;
  const hasItems = total > 0;

  function setQuantity(itemId: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  }

  async function handlePlaceOrder() {
    setError(null);
    setSubmitting(true);

    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    let res: Response;
    try {
      res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    } catch {
      setSubmitting(false);
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    setSubmitting(false);

    if (!res.ok) {
      // The server always returns JSON on failure, but guard anyway — a
      // malformed/non-JSON response shouldn't crash the page, just fall
      // back to a generic message.
      const data: { error?: string } = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong placing the order.");
      return;
    }

    // A full navigation (rather than router.push) so the destination always
    // gets a fresh server render — no stale client-router cache to worry about.
    window.location.href = "/orders";
  }

  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Catalogue</h1>
        <span className="text-muted">
          {balanceUnavailable
            ? "Balance unavailable"
            : `Your balance: $${remainingBudget.toFixed(2)}`}
        </span>
      </div>

      {productsError && <Alert variant="warning">{productsError}</Alert>}
      {balanceError && <Alert variant="warning">{balanceError}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Category</th>
            <th>Name</th>
            <th>Price</th>
            <th style={{ width: "8rem" }}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.itemId}>
              <td className="text-muted">{product.category}</td>
              <td>{product.name}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>
                <Form.Control
                  type="number"
                  min={0}
                  size="sm"
                  value={quantities[product.itemId] ?? 0}
                  onChange={(e) =>
                    setQuantity(product.itemId, Number(e.target.value))
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div
        className="position-fixed bottom-0 start-0 end-0 bg-white border-top py-3 shadow"
        style={{ zIndex: 1030 }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <div>
              Order total: <strong>${total.toFixed(2)}</strong>
            </div>
            {overBudget && !balanceUnavailable && (
              <div className="text-danger small">
                Exceeds your balance of ${remainingBudget.toFixed(2)}
              </div>
            )}
          </div>
          <Button
            disabled={!hasItems || overBudget || submitting}
            onClick={handlePlaceOrder}
          >
            {submitting ? "Placing order..." : "Place order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
