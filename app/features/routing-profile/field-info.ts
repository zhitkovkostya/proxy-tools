// Field metadata: drives both form labels and the info drawer. Keeping copy
// here (rather than inline in JSX) keeps the components declarative and makes
// the docs editable in one place.

export interface FieldAlt {
  clients: string;
  value: string;
}

export interface FieldInfo {
  label: string;
  tip: string;
  format?: string;
  isToggle?: boolean;
  alts?: FieldAlt[];
}

export type FieldKey =
  | "name"
  | "dnsPrimary"
  | "dnsPrimaryUrl"
  | "dnsFallback"
  | "dnsFallbackUrl"
  | "dnsType"
  | "privateDirect"
  | "geoipUrl"
  | "geositeUrl"
  | "domainStrategy"
  | "routeOrder"
  | "globalProxy"
  | "fakeDns"
  | "useChunkFiles"
  | "blockSites"
  | "blockIp"
  | "dnsHosts"
  | "v2DomainStrategy"
  | "v2DomainMatcher"
  | "srIpv6"
  | "srUdpPolicy"
  | "srTunExcluded"
  | "srSkipProxy"
  | "srUpdateUrl"
  | "srAutoExclude"
  | "srExtraGroups"
  | "ruleDomain"
  | "ruleIp"
  | "ruleOutbound";

export const FIELD_INFO: Record<FieldKey, FieldInfo> = {
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
    tip: "URL .dat файла geoip-базы для Xray-ядра.",
    format: "прямая ссылка на .dat файл",
    alts: [
      { clients: "happ", value: "GeoipUrl" },
      { clients: "Streisand, v2RayTun, Shadowrocket", value: "не используется" },
    ],
  },
  geositeUrl: {
    label: "GeositeUrl",
    tip: "URL .dat файла geosite-базы для Xray-ядра.",
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
