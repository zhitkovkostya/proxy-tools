import type { ReactNode } from "react";

export interface CardProps {
  title?: ReactNode;
  badge?: ReactNode;
  accent?: boolean;
  children: ReactNode;
}

export function Card({ title, badge, accent, children }: CardProps) {
  return (
    <div
      className={`mb-4 overflow-hidden rounded-3xl bg-white ring-1 ${
        accent ? "ring-orange-300" : "ring-stone-200"
      }`}
    >
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <h2
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                accent ? "text-orange-600" : "text-stone-400"
              }`}
            >
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-medium text-orange-700">
                {badge}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="px-5 pb-5 pt-2 space-y-4">{children}</div>
    </div>
  );
}
