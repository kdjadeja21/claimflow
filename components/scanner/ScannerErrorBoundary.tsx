"use client";

import { Component, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerErrorBoundaryProps {
  children: ReactNode;
}

interface ScannerErrorBoundaryState {
  hasError: boolean;
}

/**
 * Isolates camera/library failures to the scanner subtree so a runtime error
 * (e.g. html5-qrcode tearing down mid-scan) shows a retry fallback instead of
 * crashing the whole page. Manual entry sits outside this boundary and keeps
 * working regardless.
 */
export class ScannerErrorBoundary extends Component<
  ScannerErrorBoundaryProps,
  ScannerErrorBoundaryState
> {
  state: ScannerErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ScannerErrorBoundaryState {
    return { hasError: true };
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
          <TriangleAlert className="size-8 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">
              Camera stopped unexpectedly
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try again, or use manual entry below.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={this.handleRetry}>
            Restart camera
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
