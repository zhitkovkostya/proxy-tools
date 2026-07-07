import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

const basename = import.meta.env.VITE_BASE_PATH || "/";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter basename={basename} />
    </StrictMode>,
  );
});
