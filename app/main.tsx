import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { RoutingProfileGenerator } from "~/features/routing-profile/RoutingProfileGenerator";
import "./app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RoutingProfileGenerator />
  </StrictMode>,
);
