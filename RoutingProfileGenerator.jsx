import React, { useState, useRef, useCallback, useEffect } from "react";
import { Info, X, Plus, Trash2, Copy, Check, Download } from "lucide-react";

// ============================================================
// bplist encoder (ported from bplist-creator, MIT) — verified
// byte-exact against the reference implementation.
// ============================================================
function bplistEncode(rootObj) {
  const chunks = [];
  let size = 0;
  const pushBytes = (b) => { chunks.push(b); size += b.length; };
  const pushByte = (b) => pushBytes(new Uint8Array([b & 0xff]));
  const asciiBytes = (str) => {
    const a = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) a[i] = str.charCodeAt(i);
    return a;
  };
  const mustBeUtf16 = (str) => {
    for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) > 0x7f) return true;
    return false;
  };
  const utf16BEBytes = (str) => {
    const a = new Uint8Array(str.length * 2);
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      a[i * 2] = (c >> 8) & 0xff;
      a[i * 2 + 1] = c & 0xff;
    }
    return a;
  };
  const bytesForValue = (value, bytes, isSignedNegative) => {
    const buf = new Uint8Array(bytes);
    let z = 0, b = bytes;
    while (b > 4) { buf[z++] = isSignedNegative ? 0xff : 0; b--; }
    for (let i = b - 1; i >= 0; i--) buf[z++] = (value >> (8 * i)) & 0xff;
    return buf;
  };
  const toEntries = (val) => {
    if (Array.isArray(val)) return toEntriesArray(val);
    if (val !== null && typeof val === "object") return toEntriesObject(val);
    if (typeof val === "string") return [{ type: "string", value: val }];
    if (typeof val === "number") return [{ type: "number", value: val }];
    if (typeof val === "boolean") return [{ type: "boolean", value: val }];
    throw new Error("bplistEncode: unhandled value " + val);
  };
  const toEntriesArray = (arr) => {
    let results = [{ type: "array", entries: [] }];
    arr.forEach((v) => {
      const entry = toEntries(v);
      results[0].entries.push(entry[0]);
      results = results.concat(entry);
    });
    return results;
  };
  const toEntriesObject = (dict) => {
    let results = [{ type: "dict", entryKeys: [], entryValues: [] }];
    const keys = Object.keys(dict);
    keys.forEach((key) => {
      const ek = toEntries(key);
      results[0].entryKeys.push(ek[0]);
      results = results.concat(ek[0]);
    });
    keys.forEach((key) => {
      const ev = toEntries(dict[key]);
      results[0].entryValues.push(ev[0]);
      results = results.concat(ev);
    });
    return results;
  };

  let entries = toEntries(rootObj);
  (function updateEntryIds() {
    const strings = {};
    let entryId = 0;
    entries.forEach((entry) => {
      if (entry.id !== undefined) return;
      if (entry.type === "string") {
        if (Object.prototype.hasOwnProperty.call(strings, entry.value)) {
          entry.type = "stringref";
          entry.id = strings[entry.value];
        } else {
          strings[entry.value] = entry.id = entryId++;
        }
      } else {
        entry.id = entryId++;
      }
    });
    entries = entries.filter((e) => e.type !== "stringref");
  })();

  const computeIdSizeInBytes = (n) => (n < 256 ? 1 : n < 65536 ? 2 : 4);
  const computeOffsetSizeInBytes = (maxOffset) =>
    maxOffset < 256 ? 1 : maxOffset < 65536 ? 2 : maxOffset < 4294967296 ? 4 : 8;
  const idSizeInBytes = computeIdSizeInBytes(entries.length);
  const writeID = (id) => pushBytes(bytesForValue(id, idSizeInBytes));
  const writeIntHeader = (kind, value) => {
    if (value < 15) pushByte((kind << 4) + value);
    else if (value < 256) { pushByte((kind << 4) + 15); pushByte(0x10); pushBytes(bytesForValue(value, 1)); }
    else if (value < 65536) { pushByte((kind << 4) + 15); pushByte(0x11); pushBytes(bytesForValue(value, 2)); }
    else { pushByte((kind << 4) + 15); pushByte(0x12); pushBytes(bytesForValue(value, 4)); }
  };
  const writeString = (entry) => {
    if (mustBeUtf16(entry.value)) { writeIntHeader(0x6, entry.value.length); pushBytes(utf16BEBytes(entry.value)); }
    else { writeIntHeader(0x5, entry.value.length); pushBytes(asciiBytes(entry.value)); }
  };
  const writeNumber = (entry) => {
    const v = entry.value;
    if (Number.isInteger(v)) {
      if (v < 0) { pushByte(0x13); pushBytes(bytesForValue(v, 8, true)); }
      else if (v <= 0xff) { pushByte(0x10); pushBytes(bytesForValue(v, 1)); }
      else if (v <= 0xffff) { pushByte(0x11); pushBytes(bytesForValue(v, 2)); }
      else if (v <= 0xffffffff) { pushByte(0x12); pushBytes(bytesForValue(v, 4)); }
      else { pushByte(0x13); pushBytes(bytesForValue(v, 8)); }
    } else {
      pushByte(0x23);
      const buf = new Uint8Array(8);
      new DataView(buf.buffer).setFloat64(0, v, false);
      pushBytes(buf);
    }
  };
  const writeBoolean = (entry) => pushByte(entry.value ? 0x09 : 0x08);
  const writeArray = (entry) => { writeIntHeader(0xa, entry.entries.length); entry.entries.forEach((e) => writeID(e.id)); };
  const writeDict = (entry) => {
    writeIntHeader(0xd, entry.entryKeys.length);
    entry.entryKeys.forEach((e) => writeID(e.id));
    entry.entryValues.forEach((e) => writeID(e.id));
  };
  const write = (entry) => {
    switch (entry.type) {
      case "dict": return writeDict(entry);
      case "number": return writeNumber(entry);
      case "array": return writeArray(entry);
      case "boolean": return writeBoolean(entry);
      case "string": return writeString(entry);
      default: throw new Error("bplistEncode: unhandled entry type " + entry.type);
    }
  };

  pushBytes(asciiBytes("bplist00"));
  const offsets = [];
  entries.forEach((entry, idx) => {
    offsets[idx] = size;
    if (!entry) pushByte(0x00);
    else write(entry);
  });
  const offsetTableOffset = size;
  const offsetSizeInBytes = computeOffsetSizeInBytes(offsetTableOffset);
  offsets.forEach((offset) => pushBytes(bytesForValue(offset, offsetSizeInBytes)));
  pushBytes(new Uint8Array(6));
  pushByte(offsetSizeInBytes);
  pushByte(idSizeInBytes);
  pushBytes(bytesForValue(entries.length, 8));
  pushBytes(bytesForValue(0, 8));
  pushBytes(bytesForValue(offsetTableOffset, 8));
  const out = new Uint8Array(size);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
}
function linesOf(str) {
  return str.split("\n").map((s) => s.trim()).filter(Boolean);
}

const PRIVATE_RANGES = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "169.254.0.0/16", "224.0.0.0/4", "255.255.255.255"];

// ============================================================
// field metadata — drives both the form labels and the drawer
// ============================================================
const FIELD_INFO = {
  name: {
    label: "Name",
    tip: "Название профиля. Попадает во все четыре формата одновременно — каждый клиент берёт это значение в своё поле имени.",
    format: "произвольный текст",
    alts: [
      { clients: "happ", value: "Name" },
      { clients: "Streisand, v2RayTun", value: "name" },
      { clients: "Shadowrocket", value: "заголовок-комментарий # Name: …" },
    ],
  },
  dnsPrimary: {
    label: "Основной DNS",
    tip: "DNS-сервер для обычных (внутренних/локальных) запросов.",
    format: "IP-адрес, напр. 8.8.8.8",
    alts: [
      { clients: "happ", value: "DomesticDNSIp" },
      { clients: "Streisand, v2RayTun", value: "не используется в routing-объекте" },
      { clients: "Shadowrocket", value: "dns-server (первый элемент)" },
    ],
  },
  dnsPrimaryUrl: {
    label: "Основной DNS, DoH/DoT URL",
    tip: "Адрес DoH/DoT для основного DNS, если шифрованный. Можно оставить пустым — тогда используется только IP.",
    format: "https://…/dns-query  или  tls://host:853",
    alts: [
      { clients: "happ", value: "DomesticDNSDomain" },
      { clients: "Streisand, v2RayTun", value: "не используется в routing-объекте" },
      { clients: "Shadowrocket", value: "dns-server (добавляется перед IP)" },
    ],
  },
  dnsFallback: {
    label: "Резервный DNS",
    tip: "DNS-сервер при недоступности основного.",
    format: "IP-адрес, напр. 1.1.1.1",
    alts: [
      { clients: "happ", value: "RemoteDNSIp" },
      { clients: "Streisand, v2RayTun", value: "не используется в routing-объекте" },
      { clients: "Shadowrocket", value: "fallback-dns-server (первый элемент)" },
    ],
  },
  dnsFallbackUrl: {
    label: "Резервный DNS, DoH/DoT URL",
    tip: "Адрес DoH/DoT для резервного DNS. Можно оставить пустым.",
    format: "https://…/dns-query  или  tls://host:853",
    alts: [
      { clients: "happ", value: "RemoteDNSDomain" },
      { clients: "Streisand, v2RayTun", value: "не используется в routing-объекте" },
      { clients: "Shadowrocket", value: "fallback-dns-server (добавляется перед IP)" },
    ],
  },
  dnsType: {
    label: "Тип DNS-запроса",
    tip: "Протокол DNS-запроса.",
    format: "DoH / DoT / UDP / TCP",
    alts: [
      { clients: "happ", value: "DomesticDNSType, RemoteDNSType" },
      { clients: "Streisand, v2RayTun", value: "не используется в routing-объекте" },
      { clients: "Shadowrocket", value: "кодируется префиксом в dns-server: https:// или tls://" },
    ],
  },
  privateDirect: {
    label: "Приватные IP напрямую",
    tip: "Включает direct-маршрут для RFC1918-диапазонов (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 и т.п.). Влияет на все четыре формата одновременно.",
    isToggle: true,
    alts: [
      { clients: "happ", value: "добавляет диапазоны в DirectIp" },
      { clients: "Streisand, v2RayTun", value: "добавляет отдельное direct-правило с ip: [...]" },
      { clients: "Shadowrocket", value: "добавляет в skip-proxy и как IP-CIDR,...,DIRECT в [Rule]" },
    ],
  },
  geoipUrl: {
    label: "GeoipUrl",
    tip: "URL .dat файла geoip-базы для Xray-ядра. Streisand, v2RayTun и Shadowrocket это поле не используют — хранится здесь для единообразия.",
    format: "прямая ссылка на .dat файл",
    alts: [
      { clients: "happ", value: "GeoipUrl" },
      { clients: "Streisand, v2RayTun, Shadowrocket", value: "не используется" },
    ],
  },
  geositeUrl: {
    label: "GeositeUrl",
    tip: "URL .dat файла geosite-базы для Xray-ядра. Streisand, v2RayTun и Shadowrocket это поле не используют — хранится здесь для единообразия.",
    format: "прямая ссылка на .dat файл",
    alts: [
      { clients: "happ", value: "GeositeUrl" },
      { clients: "Streisand, v2RayTun, Shadowrocket", value: "не используется" },
    ],
  },
  domainStrategy: {
    label: "DomainStrategy",
    tip: "Как Xray резолвит домены. AsIs — только по правилам домена. IPIfNonMatch — резолвить в IP, если домен не совпал ни с одним правилом. IPOnDemand — резолвить всегда.",
    format: "AsIs / IPIfNonMatch / IPOnDemand",
    alts: [{ clients: "happ", value: "DomainStrategy" }],
  },
  routeOrder: {
    label: "RouteOrder",
    tip: "Порядок применения групп правил: сначала проверяется block-список, потом direct, потом proxy — или другой порядок.",
    format: "block-direct-proxy / block-proxy-direct",
    alts: [{ clients: "happ", value: "RouteOrder" }],
  },
  globalProxy: {
    label: "GlobalProxy",
    tip: "Весь трафик по умолчанию идёт через прокси, если не совпал ни с одним правилом (catch-all = proxy вместо direct).",
    isToggle: true,
    alts: [{ clients: "happ", value: "GlobalProxy" }],
  },
  fakeDns: {
    label: "FakeDns",
    tip: "Использовать фейковые IP для DNS-резолва вместо настоящих — ускоряет роутинг по доменам, но может конфликтовать с некоторыми приложениями.",
    isToggle: true,
    alts: [{ clients: "happ", value: "FakeDns" }],
  },
  useChunkFiles: {
    label: "UseChunkFiles",
    tip: "Загружать geo-базы (.dat файлы) частями вместо целого файла — снижает пиковую память при загрузке.",
    isToggle: true,
    alts: [{ clients: "happ", value: "UseChunkFiles" }],
  },
  blockSites: {
    label: "BlockSites",
    tip: "Домены/geosite-категории для блокировки — дополнительный список, отдельно от правил маршрутизации выше. Правила с outboundTag=block тоже попадают в этот список.",
    format: "по одному на строку: domain:.example, geosite:category-ads",
    alts: [{ clients: "happ", value: "BlockSites" }],
  },
  blockIp: {
    label: "BlockIp",
    tip: "IP/CIDR для блокировки — дополнительный список, отдельно от правил выше.",
    format: "по одному на строку: CIDR или geoip:cc",
    alts: [{ clients: "happ", value: "BlockIp" }],
  },
  dnsHosts: {
    label: "DnsHosts",
    tip: "Жёсткое переопределение DNS для конкретных хостов — hostname → IP. Полезно для принудительного резолва DoH/DoT серверов в обход системного DNS.",
    format: "пары: hostname → IP-адрес",
    alts: [{ clients: "happ", value: "DnsHosts (объект { host: ip })" }],
  },
  v2DomainStrategy: {
    label: "domainStrategy",
    tip: "Аналог DomainStrategy happ в формате routing-объекта v2RayTun. Определяет, когда домены резолвятся в IP для сопоставления с IP-правилами.",
    format: "AsIs / IPIfNonMatch / IPOnDemand",
    alts: [{ clients: "v2RayTun", value: "domainStrategy" }],
  },
  v2DomainMatcher: {
    label: "domainMatcher",
    tip: "Алгоритм сопоставления доменов в правилах. hybrid — быстрее, расходует больше памяти. linear — медленнее, экономичнее.",
    format: "hybrid / linear",
    alts: [{ clients: "v2RayTun", value: "domainMatcher" }],
  },
  srIpv6: {
    label: "ipv6",
    tip: "Включить поддержку IPv6 в Shadowrocket. Оставляйте false, если провайдер/сеть не имеет стабильного IPv6.",
    format: "true / false",
    alts: [{ clients: "Shadowrocket", value: "ipv6" }],
  },
  srUdpPolicy: {
    label: "udp-policy-not-supported-behaviour",
    tip: "Что делать с UDP-трафиком, если выбранный сервер не поддерживает UDP-форвардинг. REJECT — отбросить пакет, DIRECT — пустить напрямую.",
    format: "REJECT / DIRECT",
    alts: [{ clients: "Shadowrocket", value: "udp-policy-not-supported-behaviour" }],
  },
  srTunExcluded: {
    label: "tun-excluded-routes",
    tip: "IP-диапазоны, исключённые из TUN-интерфейса (multicast, link-local, служебные). Обычно это стандартный набор RFC1918 + служебных диапазонов.",
    format: "CIDR через запятую",
    alts: [{ clients: "Shadowrocket", value: "tun-excluded-routes" }],
  },
  srSkipProxy: {
    label: "skip-proxy, доп. записи",
    tip: "Адреса и домены, которые идут в обход прокси напрямую через системный туннель — помимо приватных IP-диапазонов, которые добавляются отдельным чекбоксом выше.",
    format: "через запятую: hostname, *.wildcard, CIDR",
    alts: [{ clients: "Shadowrocket", value: "skip-proxy" }],
  },
  srUpdateUrl: {
    label: "update-url",
    tip: "Необязательно. URL, по которому Shadowrocket будет периодически скачивать свежую версию этого .conf файла. Работает только если вы сами выложите файл по этому адресу (GitHub raw, jsDelivr, Gist и т.п.).",
    format: "https://...",
    alts: [{ clients: "Shadowrocket", value: "update-url" }],
  },
  srAutoExclude: {
    label: "AUTO — исключить из автовыбора",
    tip: "Регулярное выражение: серверы, в имени которых найдётся совпадение, не попадут в группу AUTO с автовыбором самого быстрого сервера.",
    format: "regex-паттерн через |",
    alts: [{ clients: "Shadowrocket", value: "policy-regex-filter в группе AUTO" }],
  },
  srExtraGroups: {
    label: "доп. группы",
    tip: "Дополнительные группы серверов с автовыбором по latency (url-test) и фильтром по имени сервера. Каждая группа становится отдельной политикой, которую можно назначить правилам.",
    format: "Имя=regex, по одной группе на строку",
    alts: [{ clients: "Shadowrocket", value: "строка в [Proxy Group]" }],
  },
  ruleDomain: {
    label: "domain",
    tip: "Список доменов/паттернов для этого правила. Все записи объединяются через OR — трафик, совпавший хотя бы с одной, маршрутизируется по выбранному outboundTag.",
    format: "по одному на строку: domain:.example  geosite:name  regexp:...",
    alts: [
      { clients: "happ, Streisand, v2RayTun", value: "domain: [...]" },
      { clients: "Shadowrocket", value: "DOMAIN-SUFFIX / geosite → комментарий" },
    ],
  },
  ruleIp: {
    label: "ip",
    tip: "Список IP-адресов, CIDR-диапазонов или geoip-категорий для этого правила.",
    format: "по одному на строку: CIDR  geoip:cc",
    alts: [
      { clients: "happ, Streisand, v2RayTun", value: "ip: [...]" },
      { clients: "Shadowrocket", value: "IP-CIDR или GEOIP" },
    ],
  },
  ruleOutbound: {
    label: "outboundTag",
    tip: "Куда направлять трафик, совпавший с правилом.",
    format: "direct / proxy / block",
    alts: [
      { clients: "happ, Streisand, v2RayTun", value: "outboundTag" },
      { clients: "Shadowrocket", value: "DIRECT / PROXY / REJECT" },
    ],
  },
};

// ============================================================
// small UI primitives — self-contained, Ink-UI-inspired
// (warm grays, orange accent, full-radius controls). No Base UI
// dependency since it isn't available in this environment.
// ============================================================

function InfoDrawer({ open, onClose, info }) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-stone-50 ring-1 ring-stone-900/10 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
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
              <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">формат ввода</div>
              <div className="mt-1 font-mono text-sm text-stone-800">{info.format}</div>
            </div>
          )}

          {info?.alts && info.alts.length > 0 && (
            <div className="rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
              <div className="text-[10px] font-medium uppercase tracking-wide text-stone-400 mb-2">Альтернативные названия</div>
              <div className="space-y-1.5">
                {info.alts.map((alt, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="shrink-0 font-medium text-stone-500 min-w-[120px]">{alt.clients}:</span>
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

function FieldLabel({ fieldKey, onInfo, children }) {
  const info = FIELD_INFO[fieldKey];
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="text-xs font-medium text-stone-500">{children ?? info?.label}</span>
      <button
        type="button"
        onClick={() => onInfo(info)}
        className="flex h-4 w-4 items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-orange-600"
        aria-label={`Информация: ${info?.label}`}
      >
        <Info size={11} />
      </button>
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      type="text"
      {...props}
      className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm text-stone-800 ring-1 ring-stone-200 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-orange-400/60"
    />
  );
}

function TextArea({ rows, ...props }) {
  const ref = useRef(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    // line-height ~18px (text-xs leading-relaxed), padding 16px, min 3 rows
    const minH = 3 * 18 + 16;
    el.style.height = Math.max(el.scrollHeight, minH) + "px";
  }, []);
  useEffect(() => { resize(); }, [props.value]);
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

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border-0 bg-white px-3 py-2 text-sm text-stone-800 ring-1 ring-stone-200 outline-none focus:ring-2 focus:ring-orange-400/60"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ${checked ? "bg-orange-500" : "bg-stone-300"}`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-1"}`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

function Card({ title, badge, children, accent }) {
  return (
    <div className={`mb-4 overflow-hidden rounded-3xl bg-white ring-1 ${accent ? "ring-orange-300" : "ring-stone-200"}`}>
      {title && (
        <div className={`flex items-center justify-between px-5 pt-4 pb-2 ${accent ? "" : ""}`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-[11px] font-semibold uppercase tracking-wide ${accent ? "text-orange-600" : "text-stone-400"}`}>{title}</h2>
            {badge && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-medium text-orange-700">{badge}</span>
            )}
          </div>
        </div>
      )}
      <div className="px-5 pb-5 pt-2 space-y-4">{children}</div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-4 flex gap-1 rounded-full bg-stone-200/70 p-1.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 rounded-full px-2 py-2 text-center transition-colors duration-150 ${
            active === t.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <div className="text-xs font-semibold">{t.name}</div>
          <div className="text-[9.5px] text-stone-400">{t.scheme}</div>
        </button>
      ))}
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 active:bg-stone-950"
    >
      {children}
    </button>
  );
}
function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-2xl bg-stone-100 px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200 transition-colors hover:bg-stone-200 hover:text-stone-800 ${className}`}
    >
      {children}
    </button>
  );
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const doCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [text]);
  return (
    <SecondaryButton onClick={doCopy} className="flex w-full items-center justify-center gap-2">
      {copied ? <Check size={14} className="text-orange-600" /> : <Copy size={14} />}
      {copied ? "Скопировано" : `Скопировать ${label}`}
    </SecondaryButton>
  );
}

// ============================================================
// rule editor
// ============================================================
function RuleEditor({ rules, setRules, onInfo }) {
  const updateRule = (idx, patch) => {
    setRules((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const removeRule = (idx) => setRules((rs) => rs.filter((_, i) => i !== idx));
  const addRule = () => setRules((rs) => [...rs, { name: "New rule", domains: [], ips: [], outboundTag: "proxy" }]);

  const outboundOptions = [
    { value: "direct", label: "direct" },
    { value: "proxy", label: "proxy" },
    { value: "block", label: "block" },
  ];

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
                rows={2}
                value={rule.domains.join("\n")}
                onChange={(e) => updateRule(idx, { domains: linesOf(e.target.value) })}
                placeholder="domain:.ru&#10;geosite:category-ru"
              />
            </div>
            <div>
              <FieldLabel fieldKey="ruleIp" onInfo={onInfo} />
              <TextArea
                rows={2}
                value={rule.ips.join("\n")}
                onChange={(e) => updateRule(idx, { ips: linesOf(e.target.value) })}
                placeholder="10.0.0.0/8&#10;geoip:ru"
              />
            </div>
            <div>
              <FieldLabel fieldKey="ruleOutbound" onInfo={onInfo} />
              <Select value={rule.outboundTag} onChange={(v) => updateRule(idx, { outboundTag: v })} options={outboundOptions} />
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

// ============================================================
// shadowrocket .conf translation helpers
// ============================================================
function srPolicyFor(outboundTag) {
  if (outboundTag === "block") return "REJECT";
  if (outboundTag === "direct") return "DIRECT";
  return "PROXY";
}
function srDomainToken(token, policy) {
  if (token.startsWith("domain:")) {
    const d = token.slice("domain:".length);
    return `DOMAIN-SUFFIX,${d.replace(/^\./, "")},${policy}`;
  }
  if (token.startsWith("geosite:")) {
    return `# geosite:${token.slice("geosite:".length)} — нет точного аналога в Shadowrocket, добавьте RULE-SET вручную, политика ${policy}`;
  }
  if (token.startsWith("regexp:")) {
    return `USER-AGENT,${token.slice("regexp:".length)},${policy}`;
  }
  return `DOMAIN-SUFFIX,${token.replace(/^\./, "")},${policy}`;
}
function srIpToken(token, policy) {
  if (token.startsWith("geoip:")) return `GEOIP,${token.slice("geoip:".length).toUpperCase()},${policy}`;
  if (token.includes("/")) return `IP-CIDR,${token},${policy}`;
  return `IP-CIDR,${token}/32,${policy}`;
}

// ============================================================
// main app
// ============================================================
const CLIENT_TABS = [
  { id: "happ", name: "happ", scheme: "happ://routing/add/…" },
  { id: "streisand", name: "Streisand", scheme: "streisand://import/route://…" },
  { id: "v2raytun", name: "v2RayTun", scheme: "v2raytun://import_route/…" },
  { id: "shadowrocket", name: "Shadowrocket", scheme: ".conf файл" },
];

const CLIENT_ALERTS = {
  happ: [
    "Профиль кодируется в base64(JSON) и передаётся как happ://routing/add/‹base64›.",
    "Самый богатый формат: включает DNS, GeoipUrl/GeositeUrl, отдельные списки BlockSites/BlockIp и DnsHosts.",
    "Xray-специфичные параметры (DomainStrategy, RouteOrder, GlobalProxy, FakeDns, UseChunkFiles) настраиваются в секции «happ — параметры движка» ниже.",
  ],
  streisand: [
    "Правила {name, uuid, rules} кодируются в Apple binary plist → base64 → streisand://import/route://‹base64›.",
    "Формат подтверждён разбором реального диплинка из приложения (байт-в-байт совпадение с plistlib).",
    "DNS и движковые настройки в этот объект не входят — задаются в самом приложении отдельно.",
  ],
  v2raytun: [
    "Правила кодируются в base64(JSON) и передаются как v2raytun://import_route/‹base64›.",
    "Формат подтверждён реальным импортом на устройстве (скриншот со страницы Route в приложении).",
    "DNS в routing-объект не входит — настраивается в приложении. Тот же JSON можно передать через HTTP-заголовок subscription «routing».",
  ],
  shadowrocket: [
    "Генерируется целый .conf файл. Скачайте его и откройте в Shadowrocket через «Поделиться» в Файлах — конфиг подхватится локально, без хостинга.",
    "geosite:-токены не имеют точного аналога в Shadowrocket — переносятся как комментарий-подсказка, RULE-SET нужно добавить вручную.",
    "Поле update-url необязательно и нужно только для автообновления конфига самим приложением (если выложите файл по этому адресу).",
  ],
};

export default function App() {
  const [activeClient, setActiveClient] = useState("happ");
  const [drawerInfo, setDrawerInfo] = useState(null);
  const openInfo = (info) => setDrawerInfo(info);
  const closeInfo = () => setDrawerInfo(null);

  // ---- shared state ----
  const [name, setName] = useState("RU без VPN с AdBlock");
  const [dnsPrimary, setDnsPrimary] = useState("8.8.8.8");
  const [dnsPrimaryUrl, setDnsPrimaryUrl] = useState("https://dns.google/dns-query");
  const [dnsFallback, setDnsFallback] = useState("1.1.1.1");
  const [dnsFallbackUrl, setDnsFallbackUrl] = useState("https://cloudflare-dns.com/dns-query");
  const [dnsType, setDnsType] = useState("DoH");
  const [privateDirect, setPrivateDirect] = useState(true);
  const [geoipUrl, setGeoipUrl] = useState("https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat");
  const [geositeUrl, setGeositeUrl] = useState("https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat");
  const [rules, setRules] = useState([
    { name: "Direct RU", domains: ["domain:.ru", "domain:.su", "domain:.xn--p1ai", "geosite:category-ru"], ips: [], outboundTag: "direct" },
  ]);

  // ---- happ-only state ----
  const [domainStrategy, setDomainStrategy] = useState("IPIfNonMatch");
  const [routeOrder, setRouteOrder] = useState("block-direct-proxy");
  const [globalProxy, setGlobalProxy] = useState(true);
  const [fakeDns, setFakeDns] = useState(false);
  const [useChunkFiles, setUseChunkFiles] = useState(true);
  const [blockSites, setBlockSites] = useState("geosite:CATEGORY-ADS");
  const [blockIp, setBlockIp] = useState("");
  const [dnsHosts, setDnsHosts] = useState([
    { host: "dns.google", ip: "8.8.8.8" },
    { host: "cloudflare-dns.com", ip: "1.1.1.1" },
  ]);

  // ---- v2raytun-only state ----
  const [v2DomainStrategy, setV2DomainStrategy] = useState("AsIs");
  const [v2DomainMatcher, setV2DomainMatcher] = useState("hybrid");

  // ---- shadowrocket-only state ----
  const [srIpv6, setSrIpv6] = useState("false");
  const [srUdpPolicy, setSrUdpPolicy] = useState("REJECT");
  const [srTunExcluded, setSrTunExcluded] = useState(
    "10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.0.0.0/24,192.0.2.0/24,192.88.99.0/24,192.168.0.0/16,198.51.100.0/24,203.0.113.0/24,224.0.0.0/4,255.255.255.255/32,239.255.255.250/32"
  );
  const [srSkipProxy, setSrSkipProxy] = useState("localhost,*.local,captive.apple.com,*.ru,*.su,*.рф");
  const [srUpdateUrl, setSrUpdateUrl] = useState("");
  const [srAutoExclude, setSrAutoExclude] = useState("YouTube|Россия|🇷🇺");
  const [srExtraGroups, setSrExtraGroups] = useState("YouTube-Group=YouTube|Россия|Russia|🇷🇺|🍿\nAI-Group=AI|Нейро|🤖");

  // ---- generated output ----
  const [output, setOutput] = useState(null);

  const rulesWithPrivate = useCallback(() => {
    if (!privateDirect) return rules;
    return [{ name: "Private ranges (RFC1918)", domains: [], ips: [...PRIVATE_RANGES], outboundTag: "direct" }, ...rules];
  }, [rules, privateDirect]);

  function buildHappProfile() {
    const directIp = rules.filter((r) => r.outboundTag === "direct").flatMap((r) => r.ips);
    if (privateDirect) directIp.unshift(...PRIVATE_RANGES);
    const hosts = {};
    dnsHosts.forEach(({ host, ip }) => { if (host && ip) hosts[host] = ip; });
    return {
      DirectSites: rules.filter((r) => r.outboundTag === "direct").flatMap((r) => r.domains),
      Name: name || "New Profile",
      DomesticDNSType: dnsType,
      DirectIp: directIp,
      BlockSites: linesOf(blockSites).concat(rules.filter((r) => r.outboundTag === "block").flatMap((r) => r.domains)),
      FakeDns: fakeDns,
      DomesticDNSDomain: dnsPrimaryUrl,
      ProxySites: rules.filter((r) => r.outboundTag === "proxy").flatMap((r) => r.domains),
      GeoipUrl: geoipUrl,
      ProxyIp: rules.filter((r) => r.outboundTag === "proxy").flatMap((r) => r.ips),
      DomainStrategy: domainStrategy,
      DnsHosts: hosts,
      GlobalProxy: globalProxy,
      BlockIp: linesOf(blockIp).concat(rules.filter((r) => r.outboundTag === "block").flatMap((r) => r.ips)),
      UseChunkFiles: useChunkFiles,
      DomesticDNSIp: dnsPrimary,
      RemoteDNSIp: dnsFallback,
      RemoteDNSDomain: dnsFallbackUrl,
      RemoteDNSType: dnsType,
      LastUpdated: 0,
      RouteOrder: routeOrder,
      GeositeUrl: geositeUrl,
    };
  }

  function ruleToXrayRule(rule) {
    const r = { outboundTag: rule.outboundTag === "block" ? "block" : rule.outboundTag };
    if (rule.domains.length) r.domain = rule.domains;
    if (rule.ips.length) r.ip = rule.ips;
    return r;
  }

  function buildStreisandProfile() {
    return { name: name || "New Profile", uuid: uuidv4(), rules: rulesWithPrivate().map(ruleToXrayRule) };
  }

  function buildV2RayTunProfile() {
    return {
      domainStrategy: v2DomainStrategy,
      id: uuidv4(),
      balancers: [],
      domainMatcher: v2DomainMatcher,
      rules: rulesWithPrivate().map((rule) => {
        const r = { id: uuidv4(), outboundTag: rule.outboundTag === "block" ? "block" : rule.outboundTag, type: "field", __name__: rule.name };
        if (rule.domains.length) r.domain = rule.domains;
        if (rule.ips.length) r.ip = rule.ips;
        return r;
      }),
      name: name || "New Profile",
    };
  }

  function srDnsServerList() {
    const parts = [];
    if (dnsPrimaryUrl) parts.push(dnsPrimaryUrl);
    if (dnsPrimary) parts.push(dnsPrimary);
    return parts.join(",");
  }
  function srFallbackDnsList() {
    const parts = [];
    if (dnsFallbackUrl) parts.push(dnsFallbackUrl);
    if (dnsFallback) parts.push(dnsFallback);
    parts.push("system");
    return parts.join(",");
  }

  function buildShadowrocketConf() {
    const stamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const skipProxyParts = ["localhost", "*.local", "captive.apple.com"];
    if (privateDirect) skipProxyParts.unshift(...PRIVATE_RANGES);
    linesOf(srSkipProxy.split(",").join("\n"))
      .join(",")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !skipProxyParts.includes(s))
      .forEach((s) => skipProxyParts.push(s));
    const skipProxy = skipProxyParts.join(",");

    let conf = `# ${name}: ${stamp}\n[General]\n\n`;
    conf += `ipv6 = ${srIpv6}\n`;
    conf += `private-ip-answer = true\n`;
    conf += `dns-direct-system = false\n`;
    conf += `dns-fallback-system = false\n`;
    conf += `dns-direct-fallback-proxy = true\n`;
    conf += `dns-server = ${srDnsServerList()}\n`;
    conf += `fallback-dns-server = ${srFallbackDnsList()}\n`;
    conf += `hijack-dns = :53\n`;
    conf += `skip-proxy = ${skipProxy}\n`;
    conf += `tun-excluded-routes = ${srTunExcluded}\n`;
    conf += `udp-policy-not-supported-behaviour = ${srUdpPolicy}\n`;
    if (srUpdateUrl) conf += `update-url = ${srUpdateUrl}\n`;
    conf += `\n[Proxy Group]\n`;
    linesOf(srExtraGroups).forEach((line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return;
      const gname = line.slice(0, idx).trim();
      const regex = line.slice(idx + 1).trim();
      conf += `${gname} = url-test, policy-regex-filter=(${regex}), interval=600, timeout=5, url=http://www.gstatic.com/generate_204\n`;
    });
    const autoFilter = srAutoExclude ? `^(?!.*(${srAutoExclude})).*` : ".*";
    conf += `AUTO = url-test, policy-regex-filter=${autoFilter}, interval=600, timeout=5, url=http://www.gstatic.com/generate_204\n`;
    conf += `\n[Rule]\n`;
    rulesWithPrivate().forEach((rule) => {
      const policy = srPolicyFor(rule.outboundTag);
      conf += `# ${rule.name}\n`;
      rule.domains.forEach((d) => { conf += srDomainToken(d, policy) + "\n"; });
      rule.ips.forEach((ip) => { conf += srIpToken(ip, policy) + "\n"; });
    });
    conf += `\n# Final\nFINAL,PROXY\n`;
    return conf;
  }

  function generate() {
    if (activeClient === "happ") {
      const profile = buildHappProfile();
      const jsonStr = JSON.stringify(profile, null, 2);
      const b64 = utf8ToBase64(JSON.stringify(profile));
      setOutput({ kind: "deeplink", deepLink: `happ://routing/add/${b64}`, text: jsonStr, copyLabel: "JSON" });
    } else if (activeClient === "streisand") {
      const profile = buildStreisandProfile();
      const jsonStr = JSON.stringify(profile, null, 2);
      const plistBytes = bplistEncode(profile);
      const innerB64 = bytesToBase64(plistBytes);
      const outerB64 = utf8ToBase64(`import/route://${innerB64}`);
      setOutput({ kind: "deeplink", deepLink: `streisand://${outerB64}`, text: jsonStr, copyLabel: "JSON" });
    } else if (activeClient === "v2raytun") {
      const profile = buildV2RayTunProfile();
      const jsonStr = JSON.stringify(profile, null, 2);
      const b64 = utf8ToBase64(JSON.stringify(profile));
      setOutput({ kind: "deeplink", deepLink: `v2raytun://import_route/${b64}`, text: jsonStr, copyLabel: "JSON" });
    } else if (activeClient === "shadowrocket") {
      const conf = buildShadowrocketConf();
      setOutput({ kind: "conf", text: conf, copyLabel: ".conf", confName: name });
    }
  }

  function downloadConf() {
    if (!output || output.kind !== "conf") return;
    const blob = new Blob([output.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (output.confName || "shadowrocket").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    a.href = url;
    a.download = `${safeName}.conf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function resetAll() {
    setName("RU без VPN с AdBlock");
    setDnsPrimary("8.8.8.8");
    setDnsPrimaryUrl("https://dns.google/dns-query");
    setDnsFallback("1.1.1.1");
    setDnsFallbackUrl("https://cloudflare-dns.com/dns-query");
    setDnsType("DoH");
    setPrivateDirect(true);
    setGeoipUrl("https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geoip.dat");
    setGeositeUrl("https://github.com/Loyalsoldier/v2ray-rules-dat/releases/latest/download/geosite.dat");
    setRules([{ name: "Direct RU", domains: ["domain:.ru", "domain:.su", "domain:.xn--p1ai", "geosite:category-ru"], ips: [], outboundTag: "direct" }]);
    setDomainStrategy("IPIfNonMatch");
    setRouteOrder("block-direct-proxy");
    setGlobalProxy(true);
    setFakeDns(false);
    setUseChunkFiles(true);
    setBlockSites("geosite:CATEGORY-ADS");
    setBlockIp("");
    setDnsHosts([{ host: "dns.google", ip: "8.8.8.8" }, { host: "cloudflare-dns.com", ip: "1.1.1.1" }]);
    setV2DomainStrategy("AsIs");
    setV2DomainMatcher("hybrid");
    setSrIpv6("false");
    setSrUdpPolicy("REJECT");
    setSrTunExcluded("10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.0.0.0/24,192.0.2.0/24,192.88.99.0/24,192.168.0.0/16,198.51.100.0/24,203.0.113.0/24,224.0.0.0/4,255.255.255.255/32,239.255.255.250/32");
    setSrSkipProxy("localhost,*.local,captive.apple.com,*.ru,*.su,*.рф");
    setSrUpdateUrl("");
    setSrAutoExclude("YouTube|Россия|🇷🇺");
    setSrExtraGroups("YouTube-Group=YouTube|Россия|Russia|🇷🇺|🍿\nAI-Group=AI|Нейро|🤖");
    setOutput(null);
  }

  const dnsTypeOptions = [
    { value: "DoH", label: "DoH" },
    { value: "DoT", label: "DoT" },
    { value: "UDP", label: "UDP" },
    { value: "TCP", label: "TCP" },
  ];
  const domainStrategyOptions = [
    { value: "AsIs", label: "AsIs" },
    { value: "IPIfNonMatch", label: "IPIfNonMatch" },
    { value: "IPOnDemand", label: "IPOnDemand" },
  ];
  const routeOrderOptions = [
    { value: "block-direct-proxy", label: "block-direct-proxy" },
    { value: "block-proxy-direct", label: "block-proxy-direct" },
  ];
  const v2MatcherOptions = [
    { value: "hybrid", label: "hybrid" },
    { value: "linear", label: "linear" },
  ];
  const boolOptions = [
    { value: "false", label: "false" },
    { value: "true", label: "true" },
  ];
  const udpPolicyOptions = [
    { value: "REJECT", label: "REJECT" },
    { value: "DIRECT", label: "DIRECT" },
  ];

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-6 font-sans text-stone-800">
      <div className="mx-auto max-w-xl">
        <header className="mb-5">
          <h1 className="text-lg font-bold tracking-tight text-stone-900">routing profile generator</h1>
          <p className="text-xs text-stone-500">happ · streisand · v2raytun · shadowrocket (iOS)</p>
        </header>

        <Tabs tabs={CLIENT_TABS} active={activeClient} onChange={(id) => { setActiveClient(id); setOutput(null); }} />

        <div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <ul className="space-y-1">
            {(CLIENT_ALERTS[activeClient] || []).map((line, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-amber-900">
                <span className="mt-0.5 shrink-0 text-amber-400">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* shared section */}
        <Card title="общее для всех клиентов" badge="не сбрасывается" accent>
          <div>
            <FieldLabel fieldKey="name" onInfo={openInfo} />
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="pt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">DNS</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel fieldKey="dnsPrimary" onInfo={openInfo} />
              <TextInput value={dnsPrimary} onChange={(e) => setDnsPrimary(e.target.value)} />
            </div>
            <div>
              <FieldLabel fieldKey="dnsPrimaryUrl" onInfo={openInfo} />
              <TextInput value={dnsPrimaryUrl} onChange={(e) => setDnsPrimaryUrl(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel fieldKey="dnsFallback" onInfo={openInfo} />
              <TextInput value={dnsFallback} onChange={(e) => setDnsFallback(e.target.value)} />
            </div>
            <div>
              <FieldLabel fieldKey="dnsFallbackUrl" onInfo={openInfo} />
              <TextInput value={dnsFallbackUrl} onChange={(e) => setDnsFallbackUrl(e.target.value)} />
            </div>
          </div>
          <div>
            <FieldLabel fieldKey="dnsType" onInfo={openInfo} />
            <Select value={dnsType} onChange={setDnsType} options={dnsTypeOptions} />
          </div>

          <div className="pt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">сеть</div>
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
            <FieldLabel fieldKey="privateDirect" onInfo={openInfo}>
              <span className="text-xs font-medium text-stone-700">Приватные IP напрямую</span>
            </FieldLabel>
            <Switch checked={privateDirect} onChange={setPrivateDirect} />
          </div>

          <div className="pt-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">движок / гео-источники</div>
          <div>
            <FieldLabel fieldKey="geoipUrl" onInfo={openInfo} />
            <TextInput value={geoipUrl} onChange={(e) => setGeoipUrl(e.target.value)} />
          </div>
          <div>
            <FieldLabel fieldKey="geositeUrl" onInfo={openInfo} />
            <TextInput value={geositeUrl} onChange={(e) => setGeositeUrl(e.target.value)} />
          </div>
        </Card>

        <Card title="правила маршрутизации" badge="не сбрасывается" accent>
          <RuleEditor rules={rules} setRules={setRules} onInfo={openInfo} />
        </Card>

        {/* per-client sections */}
        {activeClient === "happ" && (
          <>
            <Card title="happ — параметры движка">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel fieldKey="domainStrategy" onInfo={openInfo} />
                  <Select value={domainStrategy} onChange={setDomainStrategy} options={domainStrategyOptions} />
                </div>
                <div>
                  <FieldLabel fieldKey="routeOrder" onInfo={openInfo} />
                  <Select value={routeOrder} onChange={setRouteOrder} options={routeOrderOptions} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
                <FieldLabel fieldKey="globalProxy" onInfo={openInfo}><span className="text-xs font-medium text-stone-700">GlobalProxy</span></FieldLabel>
                <Switch checked={globalProxy} onChange={setGlobalProxy} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
                <FieldLabel fieldKey="fakeDns" onInfo={openInfo}><span className="text-xs font-medium text-stone-700">FakeDns</span></FieldLabel>
                <Switch checked={fakeDns} onChange={setFakeDns} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-200">
                <FieldLabel fieldKey="useChunkFiles" onInfo={openInfo}><span className="text-xs font-medium text-stone-700">UseChunkFiles</span></FieldLabel>
                <Switch checked={useChunkFiles} onChange={setUseChunkFiles} />
              </div>
            </Card>

            <Card title="happ — дополнительные списки">
              <div>
                <FieldLabel fieldKey="blockSites" onInfo={openInfo} />
                <TextArea rows={2} value={blockSites} onChange={(e) => setBlockSites(e.target.value)} />
              </div>
              <div>
                <FieldLabel fieldKey="blockIp" onInfo={openInfo} />
                <TextArea rows={2} value={blockIp} onChange={(e) => setBlockIp(e.target.value)} />
              </div>
              <div>
                <FieldLabel fieldKey="dnsHosts" onInfo={openInfo} />
                <div className="space-y-2">
                  {dnsHosts.map((row, idx) => (
                    <div key={idx} className="flex gap-2">
                      <TextInput
                        value={row.host}
                        placeholder="dns.google"
                        onChange={(e) => setDnsHosts((hs) => hs.map((h, i) => (i === idx ? { ...h, host: e.target.value } : h)))}
                      />
                      <TextInput
                        value={row.ip}
                        placeholder="8.8.8.8"
                        onChange={(e) => setDnsHosts((hs) => hs.map((h, i) => (i === idx ? { ...h, ip: e.target.value } : h)))}
                      />
                      <button
                        onClick={() => setDnsHosts((hs) => hs.filter((_, i) => i !== idx))}
                        className="flex shrink-0 items-center justify-center rounded-xl px-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setDnsHosts((hs) => [...hs, { host: "", ip: "" }])}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 py-2 text-xs font-medium text-stone-500 hover:border-orange-400 hover:text-orange-600"
                  >
                    <Plus size={12} /> добавить запись
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}

        {activeClient === "v2raytun" && (
          <Card title="v2RayTun — параметры движка">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel fieldKey="v2DomainStrategy" onInfo={openInfo} />
                <Select value={v2DomainStrategy} onChange={setV2DomainStrategy} options={domainStrategyOptions} />
              </div>
              <div>
                <FieldLabel fieldKey="v2DomainMatcher" onInfo={openInfo} />
                <Select value={v2DomainMatcher} onChange={setV2DomainMatcher} options={v2MatcherOptions} />
              </div>
            </div>
          </Card>
        )}

        {activeClient === "shadowrocket" && (
          <>
            <Card title="Shadowrocket — [General]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel fieldKey="srIpv6" onInfo={openInfo} />
                  <Select value={srIpv6} onChange={setSrIpv6} options={boolOptions} />
                </div>
                <div>
                  <FieldLabel fieldKey="srUdpPolicy" onInfo={openInfo} />
                  <Select value={srUdpPolicy} onChange={setSrUdpPolicy} options={udpPolicyOptions} />
                </div>
              </div>
              <div>
                <FieldLabel fieldKey="srTunExcluded" onInfo={openInfo} />
                <TextArea rows={2} value={srTunExcluded} onChange={(e) => setSrTunExcluded(e.target.value)} />
              </div>
              <div>
                <FieldLabel fieldKey="srSkipProxy" onInfo={openInfo} />
                <TextInput value={srSkipProxy} onChange={(e) => setSrSkipProxy(e.target.value)} />
              </div>
              <div>
                <FieldLabel fieldKey="srUpdateUrl" onInfo={openInfo} />
                <TextInput value={srUpdateUrl} onChange={(e) => setSrUpdateUrl(e.target.value)} placeholder="https://cdn.jsdelivr.net/gh/USER/REPO@main/конфиг.conf" />
              </div>
            </Card>

            <Card title="Shadowrocket — [Proxy Group]">
              <div>
                <FieldLabel fieldKey="srAutoExclude" onInfo={openInfo} />
                <TextInput value={srAutoExclude} onChange={(e) => setSrAutoExclude(e.target.value)} />
              </div>
              <div>
                <FieldLabel fieldKey="srExtraGroups" onInfo={openInfo} />
                <TextArea rows={3} value={srExtraGroups} onChange={(e) => setSrExtraGroups(e.target.value)} />
              </div>
            </Card>
          </>
        )}

        <div className="mb-5 flex gap-2.5">
          <PrimaryButton onClick={generate}>сгенерировать профиль</PrimaryButton>
          <SecondaryButton onClick={resetAll}>сброс</SecondaryButton>
        </div>

        {output && (
          <div className="space-y-4">
            {output.kind === "deeplink" && (
              <Card title="deep link">
                <div className="break-all rounded-2xl bg-stone-900 px-4 py-3 font-mono text-[11px] leading-relaxed text-orange-300">
                  {output.deepLink}
                </div>
                <CopyButton text={output.deepLink} label="ссылку" />
              </Card>
            )}

            {output.kind === "conf" && (
              <Card title=".conf файл">
                <SecondaryButton onClick={downloadConf} className="flex w-full items-center justify-center gap-2">
                  <Download size={14} /> скачать .conf
                </SecondaryButton>
                <div className="rounded-2xl bg-orange-50 px-4 py-3 text-[11px] leading-relaxed text-orange-900 ring-1 ring-orange-200">
                  После скачивания откройте файл в Файлах (или в шторке загрузок Safari), нажмите «Поделиться» → «Shadowrocket» — конфиг подхватится как локальный.
                </div>
              </Card>
            )}

            <Card title={output.kind === "conf" ? ".conf (превью)" : "JSON"}>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-stone-900 px-4 py-3 font-mono text-[11px] leading-relaxed text-stone-200">
                {output.text}
              </pre>
              <CopyButton text={output.text} label={output.copyLabel} />
            </Card>
          </div>
        )}

        <footer className="mt-4 pb-2" />
      </div>

      <InfoDrawer open={!!drawerInfo} onClose={closeInfo} info={drawerInfo} />
    </div>
  );
}
