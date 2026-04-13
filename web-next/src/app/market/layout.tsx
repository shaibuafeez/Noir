import { AppShell } from "@/components/app-shell";

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
