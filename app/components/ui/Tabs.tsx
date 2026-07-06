export interface Tab<T extends string> {
  id: T;
  name: string;
}

export interface TabsProps<T extends string> {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}

// Compact terminal tab strip: active client rendered in yellow brackets, others dimmed.
export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  const activeTab = tabs.find((t) => t.id === active);
  return (
    <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
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
