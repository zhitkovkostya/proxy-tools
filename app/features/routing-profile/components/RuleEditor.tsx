import { Plus, Trash2 } from "lucide-react";
import { Select, TextArea } from "~/components/ui/inputs";
import { linesOf } from "~/lib/encoding";
import type { ActiveId, FieldKey } from "../field-info";
import { OUTBOUND_OPTIONS } from "../options";
import type { Rule } from "../types";
import { FieldRow } from "./FieldLabel";

export interface RuleEditorProps {
  rules: Rule[];
  onChange: (updater: (prev: Rule[]) => Rule[]) => void;
  activeKey: ActiveId | null;
  onActivate: (id: ActiveId) => void;
}

export function RuleEditor({ rules, onChange, activeKey, onActivate }: RuleEditorProps) {
  const updateRule = (idx: number, patch: Partial<Rule>) =>
    onChange((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRule = (idx: number) =>
    onChange((rs) => rs.filter((_, i) => i !== idx));
  const addRule = () =>
    onChange((rs) => [
      ...rs,
      { name: "New rule", domains: [], ips: [], outboundTag: "proxy" },
    ]);

  const rowProps = (key: FieldKey, idx: number) => {
    const id = `${key}#${idx}` as ActiveId;
    return { fieldKey: key, id, active: activeKey === id, onActivate };
  };

  return (
    <div className="space-y-1">
      {rules.map((rule, idx) => (
        <div key={idx} className="mb-2 rounded-sm border border-border px-2 py-1.5">
          <div className="mb-1 flex items-center justify-between gap-2 px-2">
            <input
              type="text"
              value={rule.name}
              spellCheck={false}
              onChange={(e) => updateRule(idx, { name: e.target.value })}
              className="w-2/3 border-0 bg-transparent p-0 text-green outline-none [caret-color:var(--color-orange)]"
            />
            <button
              onClick={() => removeRule(idx)}
              className="flex items-center gap-1 text-dim outline-none hover:text-red"
            >
              <Trash2 size={12} /> удалить
            </button>
          </div>
          <FieldRow {...rowProps("ruleDomain", idx)}>
            <TextArea
              value={rule.domains.join("\n")}
              onChange={(e) => updateRule(idx, { domains: linesOf(e.target.value) })}
              placeholder={"domain:.ru\ngeosite:category-ru"}
            />
          </FieldRow>
          <FieldRow {...rowProps("ruleIp", idx)}>
            <TextArea
              value={rule.ips.join("\n")}
              onChange={(e) => updateRule(idx, { ips: linesOf(e.target.value) })}
              placeholder={"10.0.0.0/8\ngeoip:ru"}
            />
          </FieldRow>
          <FieldRow {...rowProps("ruleOutbound", idx)}>
            <Select
              value={rule.outboundTag}
              onChange={(v) => updateRule(idx, { outboundTag: v })}
              options={OUTBOUND_OPTIONS}
            />
          </FieldRow>
        </div>
      ))}
      <button
        onClick={addRule}
        className="flex w-full items-center justify-center gap-1.5 rounded-sm border border-dashed border-border py-1.5 text-dim outline-none hover:border-yellow hover:text-yellow"
      >
        <Plus size={13} /> добавить правило
      </button>
    </div>
  );
}
