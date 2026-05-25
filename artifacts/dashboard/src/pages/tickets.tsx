import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useListTickets, getListTicketsQueryKey } from "@workspace/api-client-react";
import { Ticket, Clock, CheckCircle2, AlertCircle, ChevronRight, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_OPTIONS = ["all", "open", "closed", "pending"] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  closed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_theme(colors.violet.500)]" />,
  closed: <div className="w-2 h-2 rounded-full bg-emerald-500" />,
  pending: <div className="w-2 h-2 rounded-full bg-amber-500" />,
};

export default function Tickets() {
  const [, params] = useRoute("/tickets/:guildId");
  const guildId = params?.guildId || "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data, isLoading, isError } = useListTickets(guildId, {
    query: {
      enabled: !!guildId,
      queryKey: getListTicketsQueryKey(guildId),
    },
  });

  const tickets = data?.tickets ?? [];
  const filtered = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
            <p className="text-muted-foreground mt-1">
              {tickets.length} total tickets for this server.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center flex-col gap-4 py-16 text-muted-foreground">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p>Failed to load tickets.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center flex-col gap-4 py-16 text-muted-foreground">
            <Ticket className="w-12 h-12 opacity-40" />
            <p>No {statusFilter !== "all" ? statusFilter : ""} tickets found.</p>
          </div>
        ) : (
          <Card className="border-border/50 bg-card/50 overflow-hidden divide-y divide-border/30">
            {filtered.map((ticket) => (
              <Link key={ticket.id} href={`/tickets/${guildId}/${ticket.id}`}>
                <div className="p-5 hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      {STATUS_ICONS[ticket.status] ?? <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                      <div className="min-w-0">
                        <div className="font-medium group-hover:text-primary transition-colors truncate">
                          {ticket.subject || `Ticket #${ticket.id}`}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-mono text-muted-foreground">#{ticket.id}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.createdAt).toLocaleDateString("de-DE")}
                          </span>
                          {ticket.assignedTo && (
                            <span className="text-xs text-muted-foreground">
                              Assigned: {ticket.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[ticket.status] || ""}`}>
                        {ticket.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${PRIORITY_COLORS[ticket.priority] || ""}`}>
                        {ticket.priority}
                      </span>
                      {ticket.sentimentScore !== null && ticket.sentimentScore !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ticket.sentimentScore < -0.2 ? "bg-red-500/10 text-red-400 border-red-500/20" : ticket.sentimentScore > 0.2 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                          {ticket.sentimentScore < -0.2 ? "Frustrated" : ticket.sentimentScore > 0.2 ? "Positive" : "Neutral"}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
