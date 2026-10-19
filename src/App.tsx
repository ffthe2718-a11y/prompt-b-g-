import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PlatformLayout from "@/components/platform/PlatformLayout";
import PlatformHome from "@/pages/PlatformHome";
import Pricing from "@/pages/Pricing";
import Marketplace from "@/pages/Marketplace";
import AuthPage from "@/pages/AuthPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import GoogleCallback from "@/pages/GoogleCallback";
import VerifyEmail from "@/pages/VerifyEmail";

/* Heavier, logged-in and public-site surfaces are split into their own chunks
   so first-time visitors only download the marketing pages. */
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const OwnerDashboard = lazy(() => import("@/pages/owner/OwnerDashboard"));
const PreviewPage = lazy(() => import("@/pages/owner/PreviewPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const PublicSalon = lazy(() => import("@/pages/PublicSalon"));
const AdminSalonPreview = lazy(() => import("@/pages/admin/SalonPreview"));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Loading</span>
      </div>
    </div>
  );
}

const ROUTE_TITLES: { pattern: RegExp; title: string }[] = [
  { pattern: /^\/$/, title: "Velvet Salon Studio — Websites & booking for independent salons" },
  { pattern: /^\/pricing$/, title: "Pricing · Velvet Salon Studio" },
  { pattern: /^\/marketplace$/, title: "Live salon websites · Velvet Salon Studio" },
  { pattern: /^\/login$/, title: "Sign in · Velvet Salon Studio" },
  { pattern: /^\/signup$/, title: "Create your salon website · Velvet Salon Studio" },
  { pattern: /^\/forgot-password$/, title: "Reset your password · Velvet Salon Studio" },
  { pattern: /^\/reset-password$/, title: "Choose a new password · Velvet Salon Studio" },
  { pattern: /^\/verify-email$/, title: "Confirm your email · Velvet Salon Studio" },
  { pattern: /^\/auth\/google\/callback$/, title: "Signing in with Google · Velvet Salon Studio" },
  { pattern: /^\/onboarding$/, title: "Set up your salon · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/preview$/, title: "Website preview · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/website$/, title: "Website editor · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/services$/, title: "Services · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/team$/, title: "Team · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/gallery$/, title: "Gallery · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/bookings$/, title: "Bookings · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/reviews$/, title: "Reviews · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/analytics$/, title: "Analytics · Velvet Salon Studio" },
  { pattern: /^\/dashboard\/settings$/, title: "Settings · Velvet Salon Studio" },
  { pattern: /^\/dashboard$/, title: "Overview · Velvet Salon Studio" },
  { pattern: /^\/admin$/, title: "Platform admin · Velvet Salon Studio" },
];

function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = ROUTE_TITLES.find((entry) => entry.pattern.test(pathname));
    // Public salon pages manage their own title from the salon's SEO settings.
    if (match) document.title = match.title;

    // Private consoles should never be indexed.
    const privateArea = /^\/(admin|dashboard|onboarding|reset-password|auth\/google)/.test(pathname);
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (privateArea) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
    } else if (robots) {
      robots.remove();
    }
  }, [pathname]);
  return null;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.replace(/^#/, ""));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <RouteTitle />
          <ScrollToTop />
          <div className="min-h-screen bg-background text-foreground selection:bg-primary/25 selection:text-foreground">
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<PlatformLayout />}>
                <Route path="/" element={<PlatformHome />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/marketplace" element={<Marketplace />} />
              </Route>

              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireOwner>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireOwner>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/preview"
                element={
                  <ProtectedRoute requireOwner>
                    <PreviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:section"
                element={
                  <ProtectedRoute requireOwner>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/preview/:id"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminSalonPreview />
                  </ProtectedRoute>
                }
              />

              <Route path="/s/:slug" element={<PublicSalon />} />
              <Route path="/:slug" element={<PublicSalon />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </div>
          <Toaster position="top-center" />
        </Router>
      </TooltipProvider>
    </AuthProvider>
  );
}
