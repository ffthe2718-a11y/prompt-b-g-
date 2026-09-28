import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes("permissions")) {
            errorMessage = "You don't have permission to perform this action. Please sign in or contact support.";
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="mb-4 text-3xl font-light tracking-tight">System Error</h1>
          <p className="mb-8 max-w-md text-white/60">
            {errorMessage}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-8 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-white/90"
          >
            Reload Application
          </Button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
