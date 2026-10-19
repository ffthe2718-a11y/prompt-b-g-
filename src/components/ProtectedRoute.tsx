import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Super admin only (platform staff). */
  requireAdmin?: boolean;
  /** Salon owner only; platform staff are redirected to their own console. */
  requireOwner?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireOwner = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-50">Loading studio</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={user.role === "owner" ? "/dashboard" : "/"} replace />;
  }

  if (requireOwner && user.role !== "owner") {
    return <Navigate to={user.role === "super_admin" ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
