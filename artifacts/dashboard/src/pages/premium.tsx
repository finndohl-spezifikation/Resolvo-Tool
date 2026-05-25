import { useState } from "react";
import { useRoute } from "wouter";
import { CheckCircle2, Zap, BarChart3, Tag, Clock, Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  { icon: Zap, label: "AI reply suggestions based on ticket history" },
  { icon: BarChart3, label: "Advanced analytics and trend reports" },
  { icon: Tag, label: "Unlimited custom ticket categories" },
  { icon: Clock, label: "Support hours scheduling with auto-responses" },
  { icon: Trophy, label: "Staff leaderboard with performance scores" },
  { icon: Star, label: "Priority support queue and SLA tracking" },
];

export default function Premium() {
  const [, params] = useRoute("/dashboard/:guildId");
  const guildId = params?.guildId || "";
  const [inputGuildId, setInputGuildId] = useState(guildId);

  const handleUpgrade = () => {
    const id = inputGuildId.trim();
    if (!id) return;
    window.location.href = `/api/premium/checkout?guild=${id}&user=0`;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium px-4 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            Premium
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Unlock the full potential</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One payment. Permanent access. Everything your support team needs to operate at the highest level.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Included with Premium
            </h2>
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm text-foreground/80">{label}</span>
              </div>
            ))}
          </div>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-card/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black tracking-tight">5,99</span>
                <div className="pb-2">
                  <span className="text-xl font-bold">€</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">One-time payment. Permanent access. No subscriptions.</p>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="space-y-2">
                {[
                  "Lifetime access for one server",
                  "All future Premium features included",
                  "No recurring fees ever",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Your Guild ID
                </label>
                <Input
                  placeholder="Enter your Discord Guild ID"
                  value={inputGuildId}
                  onChange={(e) => setInputGuildId(e.target.value)}
                  className="font-mono bg-background/50"
                />
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  onClick={handleUpgrade}
                  disabled={!inputGuildId.trim()}
                >
                  Get Premium — 5,99€
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure payment via Stripe. Instant activation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
