import { useRoute, Link } from "wouter";
import { useGetGuildStats, getGetGuildStatsQueryKey } from "@workspace/api-client-react";
import { Activity, Ticket, CheckCircle2, Star, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [, params] = useRoute("/dashboard/:guildId");
  const guildId = params?.guildId || "";

  const { data: stats, isLoading, isError } = useGetGuildStats(guildId, {
    query: {
      enabled: !!guildId,
      queryKey: getGetGuildStatsQueryKey(guildId)
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-muted-foreground">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p>Failed to load dashboard statistics.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-muted-foreground mt-1">Live support metrics for your server.</p>
          </div>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs border-primary/20 text-primary bg-primary/10">
            GUILD: {guildId}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
              <Ticket className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.open}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Closed Tickets</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.closed}</div>
              <p className="text-xs text-muted-foreground mt-1">Resolved issues</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total This Month</CardTitle>
              <Activity className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all statuses</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
              <Star className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgRating ? Number(stats.avgRating).toFixed(1) : "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-1">From user feedback</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
            <Link href={`/tickets/${guildId}`} className="text-sm text-primary hover:underline font-medium">
              View all tickets &rarr;
            </Link>
          </div>
          <Card className="border-border/50 bg-card/50 overflow-hidden">
            {stats.recentTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No recent tickets found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {stats.recentTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${guildId}/${ticket.id}`}>
                    <div className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-primary shadow-[0_0_10px_theme(colors.primary.DEFAULT)]' : ticket.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div>
                          <div className="font-medium group-hover:text-primary transition-colors">
                            {ticket.subject || `Ticket #${ticket.id}`}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs">ID: {ticket.id}</span>
                            <span>&bull;</span>
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {ticket.priority}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
