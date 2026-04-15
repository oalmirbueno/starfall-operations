import { LayoutDashboard, CreditCard, Server, KeyRound, Bell, DollarSign, Lightbulb, StickyNote, FileBarChart, Settings, LogOut, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoAceleriq from "@/assets/logo-aceleriq.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assinaturas", url: "/assinaturas", icon: CreditCard },
  { title: "Infraestrutura", url: "/infraestrutura", icon: Server },
  { title: "Credenciais", url: "/credenciais", icon: KeyRound },
  { title: "Alertas", url: "/alertas", icon: Bell },
  { title: "Custos", url: "/custos", icon: DollarSign },
  { title: "Oportunidades", url: "/oportunidades", icon: Lightbulb },
  { title: "Ideias", url: "/ideias", icon: StickyNote },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarContent className="flex flex-col h-full">
        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-3 py-4 ${collapsed ? "justify-center" : ""}`}>
          <img src={logoAceleriq} alt="Aceleriq" className="h-7 w-7 rounded-md object-contain" />
          {!collapsed && (
            <div className="leading-none">
              <div className="text-[13px] font-semibold text-foreground tracking-wide">Orion Stack</div>
              <div className="text-[9px] font-mono text-muted-foreground tracking-[0.2em] uppercase">Control</div>
            </div>
          )}
        </div>

        <div className="separator-glow mx-3" />

        {/* Nav */}
        <SidebarGroup className="flex-1 pt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="group/nav flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
                        activeClassName="bg-secondary text-foreground font-medium"
                      >
                        <item.icon className={`h-[15px] w-[15px] transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover/nav:text-foreground"}`} />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {isActive && <ChevronRight className="h-3 w-3 text-primary/50" />}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User + Logout */}
        <div className="px-3 py-3">
          <div className="separator-glow mb-3" />
          {!collapsed && user && (
            <div className="text-[10px] text-muted-foreground font-mono truncate mb-2 px-1 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
              {user.email}
            </div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-150 ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
