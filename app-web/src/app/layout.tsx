import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TrIA — Do seu abrigo, para o abrigo certo",
  description:
    "Uma rede de cuidado que conecta doações às necessidades de cada abrigo. Protótipo demonstrativo do Hackathon CEUE.",
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
