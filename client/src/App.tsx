import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LeaderboardPage from "@/pages/leaderboard-page";
import SubmissionsPage from "@/pages/submissions-page";
import AdminPage from "@/pages/admin-page";
import IdeaDetailPage from "@/pages/idea-detail-page";
import SubmitIdeaPage from "@/pages/submit-idea-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
      <ProtectedRoute path="/submissions" component={SubmissionsPage} />
      <AdminRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/ideas/:id" component={IdeaDetailPage} />
      <ProtectedRoute path="/submit" component={SubmitIdeaPage} />
      <ProtectedRoute path="/submit/:type" component={SubmitIdeaPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
