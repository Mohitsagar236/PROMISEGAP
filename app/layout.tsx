import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromiseGap",
  description: "Catch customer promises before they become product escalations."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
