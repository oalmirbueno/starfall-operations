import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full tech-grid-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative z-10">
          <header className="h-11 flex items-center justify-between border-b border-border/60 px-4 bg-background/70 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <div className="separator-glow w-px h-4" />
              <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] uppercase">
                Orion Stack Control
              </span>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
                <span className="text-[10px] font-mono text-muted-foreground">online</span>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-auto p-5 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
