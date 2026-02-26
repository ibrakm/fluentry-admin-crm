import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "./contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc-vercel";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Payments from "@/pages/Payments";
import Schedule from "@/pages/Schedule";
import Progress from "@/pages/Progress";
import Leads from "@/pages/Leads";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/NotFound";

function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.isLoading) return;
    setIsAuthenticated(!!meQuery.data);
  }, [meQuery.data, meQuery.isLoading]);

  if (isAuthenticated === null || meQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/students" component={Students} />
      <Route path="/students/:id" component={StudentDetail} />
      <Route path="/payments" component={Payments} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/progress" component={Progress} />
      <Route path="/leads" component={Leads} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function AppVercel() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  }));
  const [trpcClient] = useState(() => createTrpcClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <AuthGuard>
              <Router />
            </AuthGuard>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
