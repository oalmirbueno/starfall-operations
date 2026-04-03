import { LayoutDashboard, CreditCard, Server, KeyRound, Bell, DollarSign, Lightbulb, FileBarChart, Settings, LogOut } from "lucide-react";
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
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="flex flex-col h-full">
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-border ${collapsed ? "justify-center" : ""}`}>
          <img src={logoAceleriq} alt="Aceleriq" className="h-8 w-8 rounded-md object-contain" />
          {!collapsed && (
            <div>
              <div className="text-sm font-semibold text-foreground tracking-wide">Orion Stack</div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Control</div>
            </div>
          )}
        </div>
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-secondary/50 text-muted-foreground"
                      activeClassName="bg-secondary text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User info + logout */}
        <div className="border-t border-border px-3 py-3">
          {!collapsed && user && (
            <div className="text-[11px] text-muted-foreground font-mono truncate mb-2 px-1">
              {user.email}
            </div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
