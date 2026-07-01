import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { FIELD_INFO, type FieldInfo, type FieldKey } from "../field-info";

export interface FieldLabelProps {
  fieldKey: FieldKey;
  onInfo: (info: FieldInfo) => void;
  children?: ReactNode;
}

// Label + ⓘ button that opens the info drawer for a given field.
export function FieldLabel({ fieldKey, onInfo, children }: FieldLabelProps) {
  const info = FIELD_INFO[fieldKey];
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="text-xs font-medium text-stone-500">
        {children ?? info.label}
      </span>
      <button
        type="button"
        onClick={() => onInfo(info)}
        className="flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-orange-600"
        aria-label={`Информация: ${info.label}`}
      >
        <Info size={11} />
      </button>
    </div>
  );
}
