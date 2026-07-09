import { Component, type ReactNode } from "react";

/**
 * The intro is decorative — if a rendering error slips through (e.g. an
 * unusual browser), fail silently to nothing rather than blocking the app.
 * The parent's own timers still fire and hand off to the dashboard.
 */
export class IntroErrorBoundary extends Component<{ children: ReactNode }, { errored: boolean }> {
  state = { errored: false };

  static getDerivedStateFromError() {
    return { errored: true };
  }

  render() {
    if (this.state.errored) return null;
    return this.props.children;
  }
}
