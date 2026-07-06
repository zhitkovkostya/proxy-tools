import type { FieldInfo } from "../field-info";

export interface FieldInfoPanelProps {
  info: FieldInfo | null;
}

// Canonical client order — aliases are always rendered in this sequence,
// one client per row, regardless of how they're grouped in field-info.
const CLIENT_ORDER = ["happ", "Streisand", "v2RayTun", "Shadowrocket"];

function clientRank(client: string): number {
  const i = CLIENT_ORDER.findIndex(
    (c) => c.toLowerCase() === client.toLowerCase(),
  );
  return i === -1 ? CLIENT_ORDER.length : i;
}

// Expand grouped alts ("Streisand, v2RayTun") into one row per client, replace
// "не используется…" values with a dash, and sort by the canonical order.
function expandAlts(alts: FieldInfo["alts"]) {
  if (!alts) return [];
  const rows = alts.flatMap((alt) => {
    const value = /не используется/i.test(alt.value) ? "—" : alt.value;
    return alt.clients
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((client) => ({ client, value }));
  });
  return rows.sort((a, b) => clientRank(a.client) - clientRank(b.client));
}

// Always-visible field help (replaces the old bottom-sheet drawer). Reflects the
// currently active field: what it does, its input format, and per-client aliases.
export function FieldInfoPanel({ info }: FieldInfoPanelProps) {
  if (!info) {
    return (
      <p className="text-dim">
        наведите или сфокусируйтесь на поле — здесь появится описание
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-blue">{info.label}</div>
      <p className="leading-relaxed text-fg">{info.tip}</p>

      {!info.isToggle && info.format && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-dim">
            формат ввода
          </div>
          <div className="mt-0.5 text-green">{info.format}</div>
        </div>
      )}

      {info.alts && info.alts.length > 0 && (
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-dim">
            альтернативные названия
          </div>
          <div className="space-y-1">
            {expandAlts(info.alts).map((alt, i) => (
              <div key={i} className="flex gap-2">
                <span className="min-w-[13ch] shrink-0 text-dim">{alt.client}</span>
                <span className="text-fg">{alt.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
