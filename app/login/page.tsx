"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("buyer@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/catalogue");
    router.refresh();
  }

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "70vh" }}
    >
      <Card style={{ width: "24rem" }}>
        <Card.Body>
          <Card.Title className="mb-3">Log in</Card.Title>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </Form>
          <Form.Text className="d-block mt-3 text-muted">
            Demo login: buyer@example.com / password123
          </Form.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}
