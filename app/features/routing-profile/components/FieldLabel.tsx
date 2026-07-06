import type { ReactNode } from "react";
import { FIELD_INFO, type FieldKey } from "../field-info";

export interface FieldRowProps {
  fieldKey: FieldKey;
  active: boolean;
  onActivate: (key: FieldKey) => void;
  /** Override the label text (defaults to FIELD_INFO[fieldKey].label). */
  label?: ReactNode;
  /** The field control (input / select / switch / textarea …). */
  children?: ReactNode;
}

// One form row in the terminal grid: `[mark] label   value`. Activating the row
// (focus / click) surfaces this field's help in the info panel — there is no ⓘ
// button anymore. Focus is captured so tabbing into the inner control also
// activates the row. Hover intentionally does NOT activate.
export function FieldRow({ fieldKey, active, onActivate, label, children }: FieldRowProps) {
  const info = FIELD_INFO[fieldKey];
  const activate = () => onActivate(fieldKey);
  return (
    <div
      className={`row relative grid grid-cols-[15ch_1fr] items-start gap-2 rounded-sm px-2 py-0.5 overflow-hidden ${
        active ? "bg-sel" : ""
      }`}
      data-key={fieldKey}
      onFocusCapture={activate}
      onClick={activate}
    >
      <span
        className={`mark absolute left-[-2px] text-orange ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        ▌
      </span>
      <span className={`truncate ${active ? "text-fg" : "text-dim"}`}>
        {label ?? info.label}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
