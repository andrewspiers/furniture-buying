"use client";

import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Alert from "react-bootstrap/Alert";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  product: { name: string };
};

type Order = {
  id: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

export default function OrdersView({
  spent,
  balance,
  balanceError,
  orders,
}: {
  spent: number;
  balance: number | null;
  balanceError?: string | null;
  orders: Order[];
}) {
  return (
    <div>
      <h1 className="h3 mb-4">My Orders</h1>

      {balanceError && <Alert variant="warning">{balanceError}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between">
            <span>
              Spent through this app: <strong>${spent.toFixed(2)}</strong>
            </span>
            <span>
              Your balance:{" "}
              <strong>
                {balance === null ? "unavailable" : `$${balance.toFixed(2)}`}
              </strong>
            </span>
          </div>
        </Card.Body>
      </Card>

      {orders.length === 0 && (
        <p className="text-muted">
          No orders yet — head to the catalogue to place one.
        </p>
      )}

      {orders.map((order) => (
        <Card key={order.id} className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between">
              <Card.Title className="h6">
                Order placed{" "}
                {new Date(order.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                })}{" "}
                UTC
              </Card.Title>
              <strong>${order.total.toFixed(2)}</strong>
            </div>
            <Table size="sm" className="mb-0 mt-2">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product.name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>${(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
