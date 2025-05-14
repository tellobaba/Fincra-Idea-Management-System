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
import AdminLoginPage from "@/pages/admin-login-page";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import IdeaDetailPage from "@/pages/idea-detail-page";
import ChallengeDetailPage from "@/pages/challenge-detail-page";
import SubmitIdeaPage from "@/pages/submit-idea-page";
import SubmitChallengePage from "@/pages/submit-challenge-page";
import SubmitPainPointPage from "@/pages/submit-pain-point-page";
import IdeasPage from "@/pages/ideas-page";
import ChallengesPage from "@/pages/challenges-page";
import PainPointsPage from "@/pages/pain-points-page";
import PainPointDetailPage from "@/pages/pain-point-detail-page";
import MyVotesPage from "@/pages/my-votes-page";
import FollowedIdeasPage from "@/pages/followed-ideas-page";
import AnalyticsPage from "@/pages/analytics-page";
import SearchResultsPage from "@/pages/search-results-page";
import SearchPage from "@/pages/search-page";
import ProfileSettingsPage from "@/pages/profile-settings-page";
import UsersPage from "@/pages/users-page";

// Lazy loaded admin routes to improve initial loading performance
import { lazy, Suspense } from "react";
const AdminSubmissionsPage = lazy(() => import("@/pages/admin/admin-submissions-page"));
const AdminUsersPage = lazy(() => import("@/pages/admin/admin-users-page"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/admin-analytics-page"));
const AdminInsightsPage = lazy(() => import("@/pages/admin/admin-insights-page"));
const AdminCommentsPage = lazy(() => import("@/pages/admin/admin-comments-page"));

// Loading fallback for lazy components
const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <AdminRoute path="/admin/dashboard" component={AdminDashboardPage} />
      <AdminRoute path="/admin" component={AdminPage} />
      <AdminRoute path="/admin/submissions">
        <Suspense fallback={<LazyLoadingFallback />}>
          <AdminSubmissionsPage />
        </Suspense>
      </AdminRoute>
      <AdminRoute path="/admin/users">
        <Suspense fallback={<LazyLoadingFallback />}>
          <AdminUsersPage />
        </Suspense>
      </AdminRoute>
      <AdminRoute path="/admin/analytics">
        <Suspense fallback={<LazyLoadingFallback />}>
          <AdminAnalyticsPage />
        </Suspense>
      </AdminRoute>
      <AdminRoute path="/admin/insights">
        <Suspense fallback={<LazyLoadingFallback />}>
          <AdminInsightsPage />
        </Suspense>
      </AdminRoute>
      <AdminRoute path="/admin/comments">
        <Suspense fallback={<LazyLoadingFallback />}>
          <AdminCommentsPage />
        </Suspense>
      </AdminRoute>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
      <ProtectedRoute path="/submissions" component={SubmissionsPage} />
      <ProtectedRoute path="/ideas" component={IdeasPage} />
      <ProtectedRoute path="/ideas/:id" component={IdeaDetailPage} />
      <ProtectedRoute path="/challenges" component={ChallengesPage} />
      <ProtectedRoute path="/challenges/:id" component={ChallengeDetailPage} />
      <ProtectedRoute path="/pain-points" component={PainPointsPage} />
      <ProtectedRoute path="/pain-points/:id" component={PainPointDetailPage} />
      <ProtectedRoute path="/my-votes" component={MyVotesPage} />
      <ProtectedRoute path="/pinned">
        <FollowedIdeasPage />
      </ProtectedRoute>
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/profile-settings" component={ProfileSettingsPage} />
      <ProtectedRoute path="/submit/idea" component={SubmitIdeaPage} />
      <ProtectedRoute path="/submit/challenge" component={SubmitChallengePage} />
      <ProtectedRoute path="/submit/pain-point" component={SubmitPainPointPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/search/results" component={SearchResultsPage} />
      <AdminRoute path="/users" component={UsersPage} />
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
