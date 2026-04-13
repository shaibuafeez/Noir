"use client";

import { Sidebar, MobileHeader } from "./sidebar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Ambient gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-[300px] w-[500px] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[200px] w-[400px] rounded-full bg-primary/[0.02] blur-[100px]" />
      </div>
      <Sidebar />
      <MobileHeader />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
