import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [, setLocation] = useLocation();
  const [guildId, setGuildId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guildId.trim()) {
      setLocation(`/dashboard/${guildId.trim()}`);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Resolvo Dashboard</h1>
          <p className="text-muted-foreground text-lg">Command center for your support operations.</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Select Server</CardTitle>
            <CardDescription>Enter your Discord Guild ID to view its dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="e.g. 123456789012345678"
                  value={guildId}
                  onChange={(e) => setGuildId(e.target.value)}
                  className="font-mono bg-background/50"
                  data-testid="input-guild-id"
                />
                <Button type="submit" disabled={!guildId.trim()} data-testid="button-submit-guild">
                  Connect <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mt-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Secure OAuth Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>Real-time Metrics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
