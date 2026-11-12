"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface PreviewErrorBoundaryProps {
  /** Rendered instead of the children once they throw. Gets the error. */
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
}

interface PreviewErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps a crash inside the certificate canvas (Konva) from taking the whole
 * page down to Next's generic "This page couldn't load". The caller decides
 * what to show instead; the original error is still logged for debugging.
 */
export class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[certificate-preview] render failed", error, info.componentStack);
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
