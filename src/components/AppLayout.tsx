import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full tech-grid-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative z-10">
          <header className="h-12 flex items-center border-b border-border px-4 bg-background/80 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <span className="ml-4 text-xs font-mono text-muted-foreground tracking-widest uppercase">Orion Stack Control</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
