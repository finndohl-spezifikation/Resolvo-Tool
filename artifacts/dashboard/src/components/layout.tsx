import React from "react";
import { Link, useRoute } from "wouter";
import { Activity, LayoutDashboard, Ticket, Star, ChevronLeft, CreditCard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [matchDashboard, paramsDashboard] = useRoute("/dashboard/:guildId");
  const [matchTickets, paramsTickets] = useRoute("/tickets/:guildId");
  const [matchTicketDetail, paramsTicketDetail] = useRoute("/tickets/:guildId/:id");
  
  const guildId = paramsDashboard?.guildId || paramsTickets?.guildId || paramsTicketDetail?.guildId;
  const isPremiumRoute = useRoute("/premium")[0];
  const isHomeRoute = useRoute("/")[0];

  if (isHomeRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50">
            <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight">
              <Activity className="w-5 h-5" />
              <span>Resolvo</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {guildId ? (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 px-6">
                  Guild Operations
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="px-4 space-y-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={matchDashboard}>
                        <Link href={`/dashboard/${guildId}`} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-muted">
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Overview</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={matchTickets || matchTicketDetail}>
                        <Link href={`/tickets/${guildId}`} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-muted">
                          <Ticket className="w-4 h-4" />
                          <span>Tickets</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : null}

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu className="px-4 space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isPremiumRoute}>
                      <Link href="/premium" className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-muted text-amber-400 hover:text-amber-300">
                        <Star className="w-4 h-4" />
                        <span>Premium</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-muted text-muted-foreground">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Change Server</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 flex flex-col min-h-[100dvh] overflow-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
