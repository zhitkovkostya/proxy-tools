import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

export interface Tab<T extends string> {
  id: T;
  name: string;
}

export interface TabsProps<T extends string> {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Focus the active tab on mount (single tab-stop radiogroup). */
  autoFocus?: boolean;
}

// Compact terminal tab strip that behaves like a radiogroup: it occupies a
// single Tab stop (only the active tab is tabbable) and ←→/↑↓ move between
// options like native radio buttons.
export function Tabs<T extends string>({ tabs, active, onChange, autoFocus }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIdx = tabs.findIndex((t) => t.id === active);

  useEffect(() => {
    if (autoFocus) refs.current[active]?.focus();
    // Focus only once, on mount, so we don't steal focus on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveTo = (idx: number) => {
    const next = tabs[(idx + tabs.length) % tabs.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      moveTo(activeIdx + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      moveTo(activeIdx - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={onKeyDown}
            className={`outline-none ${
              on ? "text-yellow" : "text-dim hover:text-fg"
            }`}
          >
            {on ? `‹ ${t.name} ›` : t.name}
          </button>
        );
      })}
    </div>
  );
}
