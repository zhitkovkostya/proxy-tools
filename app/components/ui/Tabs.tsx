export interface Tab<T extends string> {
  id: T;
  name: string;
  scheme: string;
}

export interface TabsProps<T extends string> {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div className="mb-4 flex gap-1 rounded-full bg-stone-200/70 p-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 rounded-full px-2 py-2 text-center transition-colors duration-150 ${
            active === t.id
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <div className="text-xs font-semibold">{t.name}</div>
          <div className="text-[9.5px] text-stone-400">{t.scheme}</div>
        </button>
      ))}
    </div>
  );
}
