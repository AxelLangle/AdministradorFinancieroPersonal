import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Calendario Financiero Personal — Administrador Financiero PWA",
  description:
    "Claridad total sobre tu dinero, día por día. Administra tu calendario financiero, presupuesto mensual y saldo proyectado.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calendario Finanzas",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#34483D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={inter.variable}>
      <body className="antialiased selection:bg-[#34483D] selection:text-white">
        {children}
      </body>
    </html>
  );
}
