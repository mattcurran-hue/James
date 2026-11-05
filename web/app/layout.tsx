import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "James",
  description: "Matt's agent HQ",
  appleWebApp: { capable: true, title: "James", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#15130f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
