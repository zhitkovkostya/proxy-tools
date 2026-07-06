// Field metadata: drives both form labels and the info drawer. Keeping copy
// here (rather than inline in JSX) keeps the components declarative and makes
// the docs editable in one place.

export interface FieldAlt {
  clients: string;
  value: string;
}

// One choice of a select/checkbox field, with an explanation of what it means
// and what it affects. Rendered as a structured sub-section in the info panel.
export interface FieldOption {
  value: string;
  meaning: string;
}

export interface FieldInfo {
  label: string;
  tip: string;
  format?: string;
  isToggle?: boolean;
  /**
   * For select / checkbox fields: what each choice means and what it affects.
   * Rendered above "формат ввода". For a checkbox, list the on/off states.
   */
  options?: FieldOption[];
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

// The identity of an *active row* in the form. Singular fields are identified by
// their bare FieldKey; rule fields repeat across rules, so they are scoped with
// their rule index (e.g. "ruleDomain#0") to stay unique per rendered row.
export type ActiveId = FieldKey | `${FieldKey}#${number}`;

// Strip the "#idx" scope (if any) back to the FieldKey used for info lookup.
export const fieldKeyOf = (id: ActiveId): FieldKey =>
  id.split("#")[0] as FieldKey;

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
    options: [
      { value: "DoH", meaning: "DNS-over-HTTPS: запросы шифруются и идут по HTTPS (порт 443). Скрывает DNS от провайдера, сложнее заблокировать. Требует DoH URL." },
      { value: "DoT", meaning: "DNS-over-TLS: запросы шифруются по TLS на отдельном порту 853. Тоже приватно, но порт легче фильтруется, чем 443." },
      { value: "UDP", meaning: "Обычный незашифрованный DNS по UDP (порт 53). Быстро, но провайдер видит и может подменять запросы." },
      { value: "TCP", meaning: "Незашифрованный DNS по TCP (порт 53). Как UDP, но по TCP — надёжнее при потере пакетов, чуть медленнее." },
    ],
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
    options: [
      { value: "включено", meaning: "Приватные/локальные IP (роутер, NAS, устройства в LAN) идут напрямую, минуя прокси. Обычно нужно, чтобы работали локальная сеть и админки устройств." },
      { value: "выключено", meaning: "Приватные IP не получают отдельного direct-правила и попадают под общую логику маршрутизации — доступ к локальной сети может пойти через прокси и сломаться." },
    ],
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
    tip: "Как Xray резолвит домены при сопоставлении с правилами маршрутизации.",
    options: [
      { value: "AsIs", meaning: "Сопоставлять только по домену, IP-правила к доменному трафику не применяются. Быстрее всего, без лишних DNS-запросов, но домен не попадёт под IP/geoip-правило." },
      { value: "IPIfNonMatch", meaning: "Если домен не совпал ни с одним доменным правилом — резолвить его в IP и проверить IP-правила. Компромисс: лишний DNS только для несовпавших доменов." },
      { value: "IPOnDemand", meaning: "Резолвить домен в IP сразу, как только встречается любое IP-правило. Максимально точное сопоставление по IP, но больше DNS-запросов." },
    ],
    alts: [{ clients: "happ", value: "DomainStrategy" }],
  },
  routeOrder: {
    label: "RouteOrder",
    tip: "Порядок, в котором проверяются группы правил. Блокировка всегда первой; отличается очередь direct и proxy.",
    options: [
      { value: "block-direct-proxy", meaning: "Сначала block, затем direct, затем proxy. При совпадении и с direct-, и с proxy-правилом выигрывает direct — трафик чаще идёт напрямую." },
      { value: "block-proxy-direct", meaning: "Сначала block, затем proxy, затем direct. При двойном совпадении выигрывает proxy — трафик чаще идёт через прокси." },
    ],
    alts: [{ clients: "happ", value: "RouteOrder" }],
  },
  globalProxy: {
    label: "GlobalProxy",
    tip: "Что делать с трафиком, не совпавшим ни с одним правилом (поведение по умолчанию, catch-all).",
    isToggle: true,
    options: [
      { value: "включено", meaning: "Несовпавший трафик идёт через прокси. Режим «всё через VPN» — под прокси попадает и то, что вы не описали правилами." },
      { value: "выключено", meaning: "Несовпавший трафик идёт напрямую. Режим «прокси только по правилам» — через прокси идёт лишь то, что явно совпало с proxy-правилом." },
    ],
    alts: [{ clients: "happ", value: "GlobalProxy" }],
  },
  fakeDns: {
    label: "FakeDns",
    tip: "Выдавать приложениям фиктивные IP из служебного диапазона, а реальный резолв делать внутри ядра по домену.",
    isToggle: true,
    options: [
      { value: "включено", meaning: "Ядро отдаёт фейковый IP и маршрутизирует по домену без предварительного DNS-запроса. Быстрее и точнее доменные правила, но некоторые приложения (проверяющие IP) могут ломаться." },
      { value: "выключено", meaning: "Обычный DNS-резолв в настоящие IP. Максимальная совместимость, но домены резолвятся заранее и роутинг по ним чуть медленнее." },
    ],
    alts: [{ clients: "happ", value: "FakeDns" }],
  },
  useChunkFiles: {
    label: "UseChunkFiles",
    tip: "Как загружать geo-базы (.dat файлы): целиком или частями.",
    isToggle: true,
    options: [
      { value: "включено", meaning: "Грузить geo-базы частями (chunks). Ниже пиковое потребление памяти — полезно на слабых устройствах, но загрузка может быть чуть дольше." },
      { value: "выключено", meaning: "Грузить .dat файл целиком. Быстрее, но выше пик памяти в момент загрузки." },
    ],
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
    options: [
      { value: "AsIs", meaning: "Сопоставлять только по домену, без резолва в IP. Быстрее всего, но доменный трафик не попадёт под IP/geoip-правила." },
      { value: "IPIfNonMatch", meaning: "Резолвить в IP и проверять IP-правила только для доменов, не совпавших с доменными правилами. Разумный компромисс." },
      { value: "IPOnDemand", meaning: "Резолвить домен в IP при первом же встреченном IP-правиле. Точнее сопоставление, но больше DNS-запросов." },
    ],
    alts: [{ clients: "v2RayTun", value: "domainStrategy" }],
  },
  v2DomainMatcher: {
    label: "domainMatcher",
    tip: "Алгоритм сопоставления доменов в правилах.",
    options: [
      { value: "hybrid", meaning: "Индексный алгоритм: быстрее сопоставляет домены при большом числе правил, но расходует больше памяти. Значение по умолчанию для большинства случаев." },
      { value: "linear", meaning: "Последовательный перебор: медленнее на больших списках, зато экономнее по памяти. Имеет смысл на слабых устройствах." },
    ],
    alts: [{ clients: "v2RayTun", value: "domainMatcher" }],
  },
  srIpv6: {
    label: "ipv6",
    tip: "Поддержка IPv6 в Shadowrocket.",
    options: [
      { value: "true", meaning: "IPv6 включён: приложения могут использовать IPv6-адреса и AAAA-записи. Нужно, только если у сети/провайдера стабильный IPv6." },
      { value: "false", meaning: "IPv6 выключен: весь трафик идёт по IPv4. Безопасный вариант по умолчанию — исключает утечки и сбои при нестабильном IPv6." },
    ],
    alts: [{ clients: "Shadowrocket", value: "ipv6" }],
  },
  srUdpPolicy: {
    label: "udp-policy-not-supported-behaviour",
    tip: "Что делать с UDP-трафиком, если выбранный сервер не поддерживает UDP-форвардинг.",
    options: [
      { value: "REJECT", meaning: "Отбросить UDP-пакет. Приложение не получит UDP через прокси — надёжнее с точки зрения приватности (нет утечки в обход туннеля), но часть UDP-сервисов не заработает." },
      { value: "DIRECT", meaning: "Пустить UDP напрямую, минуя прокси. UDP-сервисы работают, но их трафик идёт с вашего реального IP — это утечка в обход прокси." },
    ],
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
    options: [
      { value: "direct", meaning: "Пустить напрямую, минуя прокси. Для доверенного трафика (локальные/отечественные ресурсы), которому прокси не нужен." },
      { value: "proxy", meaning: "Направить через выбранный прокси-сервер. Основной сценарий обхода блокировок." },
      { value: "block", meaning: "Заблокировать: соединение обрывается. Для рекламы, трекеров, нежелательных доменов." },
    ],
    alts: [
      { clients: "happ, Streisand, v2RayTun", value: "outboundTag" },
      { clients: "Shadowrocket", value: "DIRECT / PROXY / REJECT" },
    ],
  },
};
