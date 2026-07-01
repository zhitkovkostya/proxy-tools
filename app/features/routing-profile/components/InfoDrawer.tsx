import { X } from "lucide-react";
import type { FieldInfo } from "../field-info";

export interface InfoDrawerProps {
  open: boolean;
  onClose: () => void;
  info: FieldInfo | null;
}

// Bottom sheet describing a field: what it does, the input format, and the
// per-client field name aliases.
export function InfoDrawer({ open, onClose, info }: InfoDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-stone-50 ring-1 ring-stone-900/10 shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>
        <div className="flex items-start justify-between gap-3 px-6 pt-4 pb-2">
          <h3 className="text-base font-semibold text-stone-800">{info?.label}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 pb-8 space-y-3">
          <p className="text-sm leading-relaxed text-stone-600">{info?.tip}</p>

          {!info?.isToggle && info?.format && (
            <div className="rounded-2xl bg-stone-100 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                формат ввода
              </div>
              <div className="mt-1 font-mono text-sm text-stone-800">{info.format}</div>
            </div>
          )}

          {info?.alts && info.alts.length > 0 && (
            <div className="rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
              <div className="text-[10px] font-medium uppercase tracking-wide text-stone-400 mb-2">
                Альтернативные названия
              </div>
              <div className="space-y-1.5">
                {info.alts.map((alt, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="shrink-0 font-medium text-stone-500 min-w-[120px]">
                      {alt.clients}:
                    </span>
                    <span className="font-mono text-stone-500">{alt.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
