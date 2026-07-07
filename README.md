# proxy-tools

Веб-инструмент для генерации routing-профилей под популярные iOS/macOS прокси-клиенты.

Заполните общие настройки (DNS, правила маршрутизации) один раз — и получите готовый deeplink или конфиг-файл для нужного клиента.

## Поддерживаемые клиенты

| Клиент | Формат вывода |
|---|---|
| **happ** | `happ://routing/add/<base64(JSON)>` |
| **Streisand** | `streisand://import/route://<base64(Apple plist)>` |
| **v2RayTun** | `v2raytun://import_route/<base64(JSON)>` |
| **Shadowrocket** | `.conf`-файл (скачать и открыть локально) |

## Возможности

- Единая форма — правила в Xray-нотации (`domain:`, `geosite:`, `regexp:`, CIDR, `geoip:`) переводятся в формат каждого клиента автоматически
- Настройка DNS (DoH / DoT / UDP / TCP), primary + fallback
- Кастомные правила маршрутизации: direct / proxy / block
- Клиентоспецифичные параметры: DomainStrategy, RouteOrder, FakeDns, GeoIP/Geosite URL и др.
- Живой предпросмотр вывода — deeplink или raw payload
- Клавиатурная навигация в TUI-стиле

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173).

## Сборка

```bash
npm run build
```

## Стек

React · TypeScript · TailwindCSS · Vite
