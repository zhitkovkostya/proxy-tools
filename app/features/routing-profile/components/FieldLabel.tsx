import type { ReactNode } from "react";
import { FIELD_INFO, type ActiveId, type FieldKey } from "../field-info";

export interface FieldRowProps {
  fieldKey: FieldKey;
  /**
   * Unique identity of this row for activation/navigation. Defaults to
   * `fieldKey`; rule fields pass a scoped id (e.g. "ruleDomain#0") so repeated
   * fields across rules don't all activate at once.
   */
  id?: ActiveId;
  active: boolean;
  onActivate: (id: ActiveId) => void;
  /** Override the label text (defaults to FIELD_INFO[fieldKey].label). */
  label?: ReactNode;
  /** The field control (input / select / switch / textarea …). */
  children?: ReactNode;
  /** Dims the row and makes it non-interactive. */
  disabled?: boolean;
}

// One form row in the terminal grid: `[mark] label   value`. Activating the row
// (focus / click) surfaces this field's help in the info panel — there is no ⓘ
// button anymore. Focus is captured so tabbing into the inner control also
// activates the row. Hover intentionally does NOT activate.
export function FieldRow({ fieldKey, id = fieldKey, active, onActivate, label, children, disabled }: FieldRowProps) {
  const info = FIELD_INFO[fieldKey];
  const activate = () => { if (!disabled) onActivate(id); };
  return (
    <div
      className={`row relative grid grid-cols-[15ch_1fr] items-start gap-2 rounded-sm px-2 py-0.5 overflow-hidden ${
        active ? "bg-sel" : ""
      }`}
      data-key={id}
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
      <span className={`min-w-0 ${disabled ? "pointer-events-none opacity-35" : ""}`}>{children}</span>
    </div>
  );
}
