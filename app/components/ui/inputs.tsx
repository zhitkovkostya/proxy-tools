import { useCallback, useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

// Terminal-style inputs: text renders as plain text on the pane background,
// no boxes, an orange caret. The active-row highlight comes from the parent
// `.row` (see FieldLabel).
const controlClasses =
  "w-full border-0 overflow-hidden text-ellipsis whitespace-nowrap bg-transparent p-0 text-fg outline-none placeholder:text-dim [caret-color:var(--color-orange)]";

export function TextInput(props: ComponentPropsWithoutRef<"input">) {
  return (
    <input type="text" spellCheck={false} {...props} className={controlClasses} />
  );
}

// Textarea that auto-grows to fit its content (min ~3 rows).
export function TextArea(props: ComponentPropsWithoutRef<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const minH = 3 * 20 + 4; // line-height ~20px
    el.style.height = `${Math.max(el.scrollHeight, minH)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [props.value, resize]);

  return (
    <textarea
      ref={ref}
      spellCheck={false}
      onInput={resize}
      style={{ minHeight: 64, overflow: "hidden" }}
      {...props}
      className="w-full resize-none border-0 bg-transparent p-0 leading-relaxed text-fg outline-none placeholder:text-dim [caret-color:var(--color-orange)]"
    />
  );
}

export interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}

// Renders as `‹ value ›` with yellow brackets. A native <select> is kept on top
// (transparent) so keyboard, accessibility and click-to-open still work.
export function Select<T extends string>({ value, onChange, options }: SelectProps<T>) {
  const current = options.find((o) => o.value === value);
  return (
    <span className="tui-sel relative inline-flex items-center text-fg">
      <span className="text-yellow">‹</span>
      <span className="mx-1">{current?.label ?? value}</span>
      <span className="text-yellow">›</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent opacity-0 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-pane text-fg">
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// Checkbox-style toggle: [x] / [ ]. Green when on. Toggles with Space (like a
// native checkbox) when focused; Space is handled explicitly so the page never
// scrolls and the toggle fires even while another keydown handler is active.
export function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={`font-medium outline-none ${checked ? "text-green" : "text-dim"}`}
    >
      {checked ? "[x]" : "[ ]"}
    </button>
  );
}
