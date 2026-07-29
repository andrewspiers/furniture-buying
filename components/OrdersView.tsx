"use client";

import ProgressBar from "react-bootstrap/ProgressBar";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";

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
  budget,
  spent,
  remaining,
  orders,
}: {
  budget: number;
  spent: number;
  remaining: number;
  orders: Order[];
}) {
  const percentSpent = Math.min(100, (spent / budget) * 100);

  return (
    <div>
      <h1 className="h3 mb-4">My Orders</h1>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between mb-2">
            <span>
              Spent: <strong>${spent.toFixed(2)}</strong>
            </span>
            <span>
              Budget: <strong>${budget.toFixed(2)}</strong>
            </span>
            <span>
              Remaining:{" "}
              <strong className={remaining < 0 ? "text-danger" : ""}>
                ${remaining.toFixed(2)}
              </strong>
            </span>
          </div>
          <ProgressBar
            now={percentSpent}
            variant={percentSpent > 90 ? "danger" : "success"}
          />
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
                Order placed {new Date(order.createdAt).toLocaleString()}
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
