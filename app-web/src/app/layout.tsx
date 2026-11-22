import type { Metadata } from "next";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./globals.css";
import "./figma-theme.css";
export const metadata: Metadata = {
  icons: { icon: "/brand/tria-glass.png", apple: "/brand/tria-glass.png" },
  title: "TrIA — Do seu abrigo, para o abrigo certo",
  description:
    "Uma rede de cuidado que conecta doações às necessidades de cada abrigo.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
