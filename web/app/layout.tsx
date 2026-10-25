import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UrbanDrive Fleet Management",
  description: "Car rental and fleet management for distributed branches",
};

const links = [
  ["/", "Dashboard"],
  ["/vehicles", "Vehicles"],
  ["/bookings", "Bookings"],
  ["/customers", "Customers"],
  ["/maintenance", "Maintenance"],
  ["/reports", "Reports"],
  ["/insights", "Insights"],
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="nav">
          <nav style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 16px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ marginRight: 14 }}>UrbanDrive</strong>
            {links.map(([href, label]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
