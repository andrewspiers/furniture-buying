import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Furniture Buying",
  description: "Browse the catalogue and place orders against your budget.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavBar />
          <main className="container py-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
