import { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <div className="app-shell__glow" />
      <div className="app-shell__content">{children}</div>
    </div>
  );
}
