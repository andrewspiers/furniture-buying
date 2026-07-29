"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <Navbar bg="dark" variant="dark" expand="sm">
      <Container>
        <Navbar.Brand as={Link} href="/catalogue">
          Furniture Buying
        </Navbar.Brand>
        {session?.user && (
          <>
            <Nav className="me-auto">
              <Nav.Link as={Link} href="/catalogue">
                Catalogue
              </Nav.Link>
              <Nav.Link as={Link} href="/orders">
                My Orders
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center gap-3">
              <span className="text-light small">{session.user.name}</span>
              <Button
                size="sm"
                variant="outline-light"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Log out
              </Button>
            </div>
          </>
        )}
      </Container>
    </Navbar>
  );
}
