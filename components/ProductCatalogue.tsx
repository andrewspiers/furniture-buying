"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
};

export default function ProductCatalogue({
  products,
  remainingBudget,
}: {
  products: Product[];
  remainingBudget: number;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + product.price * (quantities[product.id] ?? 0),
        0
      ),
    [products, quantities]
  );

  const overBudget = total > remainingBudget;
  const hasItems = total > 0;

  function setQuantity(productId: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }));
  }

  async function handlePlaceOrder() {
    setError(null);
    setSubmitting(true);

    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong placing the order.");
      return;
    }

    router.push("/orders");
    router.refresh();
  }

  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Catalogue</h1>
        <span className="text-muted">
          Remaining budget: ${remainingBudget.toFixed(2)}
        </span>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {products.map((product) => (
          <Col key={product.id}>
            <Card className="h-100">
              <Card.Img variant="top" src={product.imageUrl} alt={product.name} />
              <Card.Body className="d-flex flex-column">
                <Card.Subtitle className="mb-1 text-muted small">
                  {product.category}
                </Card.Subtitle>
                <Card.Title className="h6">{product.name}</Card.Title>
                <Card.Text className="small text-muted flex-grow-1">
                  {product.description}
                </Card.Text>
                <Card.Text className="fw-bold">
                  ${product.price.toFixed(2)}
                </Card.Text>
                <Form.Group>
                  <Form.Label className="small mb-1">Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    value={quantities[product.id] ?? 0}
                    onChange={(e) =>
                      setQuantity(product.id, Number(e.target.value))
                    }
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div
        className="position-fixed bottom-0 start-0 end-0 bg-white border-top py-3 shadow"
        style={{ zIndex: 1030 }}
      >
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <div>
              Order total: <strong>${total.toFixed(2)}</strong>
            </div>
            {overBudget && (
              <div className="text-danger small">
                Exceeds remaining budget of ${remainingBudget.toFixed(2)}
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
