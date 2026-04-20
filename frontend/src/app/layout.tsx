import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "findmygif — find the perfect gif",
  description:
    "Find the perfect gif for your instagram reel comment, or response to your friends.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
