import { useRoute, Link } from "wouter";
import { useGetTicket, getGetTicketQueryKey, useUpdateTicket } from "@workspace/api-client-react";
import { AlertCircle, ArrowLeft, Star, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  urgent: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-primary/20 text-primary border-primary/30",
  closed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function TicketDetail() {
  const [, params] = useRoute("/tickets/:guildId/:id");
  const guildId = params?.guildId || "";
  const ticketId = Number(params?.id);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useGetTicket(guildId, ticketId, {
    query: {
      enabled: !!guildId && !!ticketId,
      queryKey: getGetTicketQueryKey(guildId, ticketId),
    },
  });

  const updateMutation = useUpdateTicket();

  const handleStatusChange = (status: string) => {
    updateMutation.mutate(
      { guildId, id: ticketId, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTicketQueryKey(guildId, ticketId) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center flex-col gap-4 py-16 text-muted-foreground">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p>Ticket not found.</p>
        <Link href={`/tickets/${guildId}`}>
          <Button variant="outline">Back to Tickets</Button>
        </Link>
      </div>
    );
  }

  const { ticket, messages, rating } = data;

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/tickets/${guildId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {ticket.subject || `Ticket #${ticket.id}`}
            </h1>
            <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${STATUS_COLORS[ticket.status] || ""}`}>
              {ticket.status}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full border font-medium capitalize ${PRIORITY_COLORS[ticket.priority] || ""}`}>
              {ticket.priority}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No messages recorded.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{msg.authorName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{msg.authorId}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString("de-DE")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 bg-muted/30 px-3 py-2 rounded-lg">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Ticket Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono">#{ticket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-mono text-xs">{ticket.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="font-mono text-xs truncate max-w-[120px]">{ticket.channelId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString("de-DE")}</span>
                </div>
                {ticket.closedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closed</span>
                    <span>{new Date(ticket.closedAt).toLocaleDateString("de-DE")}</span>
                  </div>
                )}
                {ticket.sentimentScore !== null && ticket.sentimentScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sentiment</span>
                    <span className={ticket.sentimentScore < -0.2 ? "text-red-400" : ticket.sentimentScore > 0.2 ? "text-emerald-400" : "text-muted-foreground"}>
                      {ticket.sentimentScore < -0.2 ? "Frustrated" : ticket.sentimentScore > 0.2 ? "Positive" : "Neutral"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {rating && (
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-5 h-5 ${n <= rating.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-muted-foreground mt-2 italic">"{rating.comment}"</p>
                  )}
                </CardContent>
              </Card>
            )}

            {ticket.status === "open" && (
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-base">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("pending")}
                    disabled={updateMutation.isPending}
                  >
                    <Clock className="w-4 h-4 mr-2 text-amber-400" />
                    Mark as Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => handleStatusChange("closed")}
                    disabled={updateMutation.isPending}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Close Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
