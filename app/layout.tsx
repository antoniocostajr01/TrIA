import type { Metadata } from "next";
import "./globals.css";
import { TriaProvider } from "@/context/TriaContext";

export const metadata: Metadata = {
  title: "TrIA · Quem abriga também precisa de abrigo",
  description:
    "Triagem inteligente com IA, mapa de doações para cidadãos e autogerência de suprimentos entre abrigos de Porto Alegre.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <TriaProvider>{children}</TriaProvider>
      </body>
    </html>
  );
}
