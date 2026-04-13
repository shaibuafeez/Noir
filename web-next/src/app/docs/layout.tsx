import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsHeader } from "@/components/docs/docs-header";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <DocsSidebar />
      <div className="lg:pl-60">
        <DocsHeader />
        <main>
          <div className="mx-auto max-w-4xl px-6 py-10 lg:px-12 lg:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
