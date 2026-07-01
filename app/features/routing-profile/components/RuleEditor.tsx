import { Plus, Trash2 } from "lucide-react";
import { Select, TextArea } from "~/components/ui/inputs";
import { linesOf } from "~/lib/encoding";
import type { FieldInfo } from "../field-info";
import { OUTBOUND_OPTIONS } from "../options";
import type { Rule } from "../types";
import { FieldLabel } from "./FieldLabel";

export interface RuleEditorProps {
  rules: Rule[];
  onChange: (updater: (prev: Rule[]) => Rule[]) => void;
  onInfo: (info: FieldInfo) => void;
}

export function RuleEditor({ rules, onChange, onInfo }: RuleEditorProps) {
  const updateRule = (idx: number, patch: Partial<Rule>) =>
    onChange((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRule = (idx: number) =>
    onChange((rs) => rs.filter((_, i) => i !== idx));
  const addRule = () =>
    onChange((rs) => [
      ...rs,
      { name: "New rule", domains: [], ips: [], outboundTag: "proxy" },
    ]);

  return (
    <div className="space-y-3">
      {rules.map((rule, idx) => (
        <div key={idx} className="rounded-2xl bg-stone-50 p-3.5 ring-1 ring-stone-200">
          <div className="mb-3 flex items-center justify-between gap-2">
            <input
              type="text"
              value={rule.name}
              onChange={(e) => updateRule(idx, { name: e.target.value })}
              className="w-2/3 bg-transparent text-sm font-semibold text-stone-800 outline-none"
            />
            <button
              onClick={() => removeRule(idx)}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-stone-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={12} /> удалить
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <FieldLabel fieldKey="ruleDomain" onInfo={onInfo} />
              <TextArea
                value={rule.domains.join("\n")}
                onChange={(e) => updateRule(idx, { domains: linesOf(e.target.value) })}
                placeholder={"domain:.ru\ngeosite:category-ru"}
              />
            </div>
            <div>
              <FieldLabel fieldKey="ruleIp" onInfo={onInfo} />
              <TextArea
                value={rule.ips.join("\n")}
                onChange={(e) => updateRule(idx, { ips: linesOf(e.target.value) })}
                placeholder={"10.0.0.0/8\ngeoip:ru"}
              />
            </div>
            <div>
              <FieldLabel fieldKey="ruleOutbound" onInfo={onInfo} />
              <Select
                value={rule.outboundTag}
                onChange={(v) => updateRule(idx, { outboundTag: v })}
                options={OUTBOUND_OPTIONS}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addRule}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-stone-300 py-2.5 text-xs font-medium text-stone-500 hover:border-orange-400 hover:text-orange-600"
      >
        <Plus size={13} /> добавить правило
      </button>
    </div>
  );
}
