import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component?: (...args: any[]) => React.JSX.Element;
  children?: React.ReactNode;
};

export function ProtectedRoute({
  path,
  component: Component,
  children,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If children are provided, render them; otherwise, use the component
  if (children) {
    return <Route path={path}>{children}</Route>;
  }
  
  return Component ? <Route path={path} component={Component} /> : null;
}

type AdminRouteProps = {
  path: string;
  component?: (...args: any[]) => React.JSX.Element;
  children?: React.ReactNode;
};

export function AdminRoute({
  path,
  component: Component,
  children,
}: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const adminRoles = ['admin', 'reviewer', 'transformer', 'implementer'];

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (!adminRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If children are provided, render them; otherwise, use the component
  if (children) {
    return <Route path={path}>{children}</Route>;
  }
  
  return Component ? <Route path={path} component={Component} /> : null;
}
