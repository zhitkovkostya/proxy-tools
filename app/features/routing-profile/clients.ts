import type { ClientId } from "./types";

export interface ClientTab {
  id: ClientId;
  name: string;
  scheme: string;
}

export const CLIENT_TABS: ClientTab[] = [
  { id: "happ", name: "happ", scheme: "happ://routing/add/…" },
  { id: "streisand", name: "Streisand", scheme: "streisand://import/route://…" },
  { id: "v2raytun", name: "v2RayTun", scheme: "v2raytun://import_route/…" },
  { id: "shadowrocket", name: "Shadowrocket", scheme: ".conf файл" },
];

// Three context bullets shown per client, swapped when the active tab changes.
export const CLIENT_ALERTS: Record<ClientId, string[]> = {
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
