import type { Route } from "./+types/home";
import { RoutingProfileGenerator } from "~/features/routing-profile/RoutingProfileGenerator";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Routing Profile Generator" },
    {
      name: "description",
      content:
        "Генератор профилей маршрутизации для iOS VPN-клиентов: happ, Streisand, v2RayTun, Shadowrocket.",
    },
  ];
}

export default function Home() {
  return <RoutingProfileGenerator />;
}
