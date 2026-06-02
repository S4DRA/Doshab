import type { ReactNode } from "react";

type AgentAmirThemeProps = {
  children: ReactNode;
};

export function AgentAmirTheme({ children }: AgentAmirThemeProps) {
  return (
    <div className="doshab-theme-agent-amir relative min-h-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="doshab-agent-amir-backdrop absolute inset-0" />
      </div>
      {children}
    </div>
  );
}

