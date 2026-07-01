import { useCallback, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

const controlClasses =
  "w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-stone-800 ring-1 ring-stone-200 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-orange-400/60";

export function TextInput(props: ComponentPropsWithoutRef<"input">) {
  return <input type="text" {...props} className={controlClasses} />;
}

// Textarea that auto-grows to fit its content (min ~3 rows).
export function TextArea(props: ComponentPropsWithoutRef<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const minH = 3 * 18 + 16; // line-height ~18px + padding
    el.style.height = `${Math.max(el.scrollHeight, minH)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [props.value, resize]);

  return (
    <textarea
      ref={ref}
      onInput={resize}
      style={{ minHeight: 70, overflow: "hidden" }}
      {...props}
      className="w-full resize-none rounded-xl border-0 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-stone-800 ring-1 ring-stone-200 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-orange-400/60"
    />
  );
}

export interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}

export function Select<T extends string>({ value, onChange, options }: SelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full appearance-none rounded-xl border-0 bg-white px-3 py-2 text-sm text-stone-800 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-orange-400/60"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-orange-500" : "bg-stone-300"
      }`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}
