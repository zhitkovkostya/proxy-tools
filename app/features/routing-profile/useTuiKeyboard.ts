import { useEffect } from "react";
import type { RefObject } from "react";
import type { FieldKey } from "./field-info";

export interface TuiKeyboardOptions {
  /** Container holding the `.row[data-key]` form rows (the left pane). */
  containerRef: RefObject<HTMLElement | null>;
  activeKey: FieldKey | null;
  setActiveKey: (key: FieldKey) => void;
  onCopy: () => void;
  onToggleFormat: () => void;
}

// Ports the mockup's keyboard model to React, operating over the actual rendered
// rows (so conditional/removed fields are handled for free):
//   ↑↓ / Tab / Enter  move between rows
//   ← →               change the select/switch inside the active row
//   c / f             copy output / toggle output format
// The DOM `[data-key]` order is the source of truth for navigation; ← → drive
// the row's native <select>/switch so all existing onChange logic is reused.
export function useTuiKeyboard({
  containerRef,
  activeKey,
  setActiveKey,
  onCopy,
  onToggleFormat,
}: TuiKeyboardOptions) {
  useEffect(() => {
    const rowsOf = (): HTMLElement[] =>
      containerRef.current
        ? Array.from(containerRef.current.querySelectorAll<HTMLElement>("[data-key]"))
        : [];

    const keyOf = (row: HTMLElement) => row.dataset.key as FieldKey;

    const activeRow = (): HTMLElement | undefined =>
      rowsOf().find((r) => keyOf(r) === activeKey);

    const focusRow = (row: HTMLElement) => {
      setActiveKey(keyOf(row));
      row.scrollIntoView({ block: "nearest" });
      const input = row.querySelector<HTMLElement>("input, textarea");
      if (input) {
        input.focus();
        if (
          input instanceof HTMLInputElement ||
          input instanceof HTMLTextAreaElement
        ) {
          const n = input.value.length;
          input.setSelectionRange(n, n);
        }
      } else if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    const move = (dir: 1 | -1) => {
      const rows = rowsOf();
      if (!rows.length) return;
      let idx = rows.findIndex((r) => keyOf(r) === activeKey);
      if (idx < 0) idx = 0;
      else idx = Math.min(rows.length - 1, Math.max(0, idx + dir));
      focusRow(rows[idx]);
    };

    // Cycle the native <select> inside the active row, firing React's onChange.
    const cycleSelect = (row: HTMLElement, dir: 1 | -1): boolean => {
      const sel = row.querySelector<HTMLSelectElement>("select");
      if (!sel) return false;
      const n = sel.options.length;
      sel.selectedIndex = (sel.selectedIndex + dir + n) % n;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };

    const toggleSwitch = (row: HTMLElement): boolean => {
      const sw = row.querySelector<HTMLButtonElement>('[role="switch"]');
      if (!sw) return false;
      sw.click();
      return true;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        move(1);
        return;
      }
      if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        move(-1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        move(1);
        return;
      }
      if (e.key === "Escape" && typing) {
        (el as HTMLElement).blur();
        return;
      }

      const row = activeRow();
      if (row && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const dir = e.key === "ArrowRight" ? 1 : -1;
        if (cycleSelect(row, dir) || toggleSwitch(row)) {
          e.preventDefault();
          return;
        }
      }

      if (!typing) {
        if (e.key === "c") {
          e.preventDefault();
          onCopy();
        } else if (e.key === "f") {
          e.preventDefault();
          onToggleFormat();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [containerRef, activeKey, setActiveKey, onCopy, onToggleFormat]);
}
