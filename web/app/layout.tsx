import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";
import { getSession, type Role } from "@/lib/auth";

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

const links: [string, string, Role[]][] = [
  ["/", "Dashboard", ["Admin", "Branch_Manager"]],
  ["/vehicles", "Vehicles", ["Admin", "Branch_Manager", "Customer"]],
  ["/bookings", "Bookings", ["Admin", "Branch_Manager", "Customer"]],
  ["/customers", "Customers", ["Admin", "Branch_Manager"]],
  ["/maintenance", "Maintenance", ["Admin", "Branch_Manager"]],
  ["/reports", "Reports", ["Admin"]],
  ["/insights", "Insights", ["Admin"]],
];

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="nav">
          <nav style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 16px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ marginRight: 14 }}>UrbanDrive</strong>
            {session && links.filter(([, , roles]) => roles.includes(session.role)).map(([href, label]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
            {session && (
              <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                <span className="muted">{session.username} ({session.role.replace("_", " ")})</span>
                <LogoutButton />
              </span>
            )}
          </nav>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
