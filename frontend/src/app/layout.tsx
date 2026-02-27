import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/global.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Claudio Salazar - Frontend Developer & UI/UX Designer",
  description: "Portafolio web de Claudio Salazar, Frontend Developer y Diseñador UI/UX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
