import { AppShell } from "@/components/app-shell";

export default function StrategiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
