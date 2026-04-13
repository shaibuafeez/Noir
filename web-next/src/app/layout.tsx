import type { Metadata, Viewport } from "next";
import { WsProvider } from "@/lib/ws-context";
import { AleoWalletWrapper } from "@/lib/wallet-provider";
import { PreloaderGate } from "@/components/preloader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Noir — Private Trading Agent on Aleo",
  description:
    "Trade privately on Aleo. Your portfolio is a zero-knowledge secret. AI-powered trading agent with copy trading, DCA, limit orders, and alerts.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="scanlines">
        <AleoWalletWrapper>
          <WsProvider>
            <PreloaderGate>{children}</PreloaderGate>
          </WsProvider>
        </AleoWalletWrapper>
      </body>
    </html>
  );
}
