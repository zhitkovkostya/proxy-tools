import type { ReactNode } from "react";

export interface CardProps {
  title?: ReactNode;
  badge?: ReactNode;
  accent?: boolean;
  children: ReactNode;
}

// Terminal "pane": a thin bordered box with its title notched into the top
// border (absolutely positioned, painted over the border on the pane bg).
export function Card({ title, badge, accent, children }: CardProps) {
  return (
    <div
      className={`relative mb-5 rounded-sm border bg-pane px-3 pb-3 pt-3.5 ${
        accent ? "border-border-hi" : "border-border"
      }`}
    >
      {title && (
        <div className="absolute -top-[0.72em] left-3 flex items-center gap-2 bg-pane px-1.5 text-xs">
          <span className={accent ? "text-yellow" : "text-blue"}>{title}</span>
          {badge && <span className="text-dim">· {badge}</span>}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
