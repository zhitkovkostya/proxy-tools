import { useCallback, useState } from "react";
import { DEFAULT_STATE } from "./constants";
import type { ProfileState } from "./types";

type Updater<T> = T | ((prev: T) => T);

export interface ProfileStore {
  state: ProfileState;
  set: <K extends keyof ProfileState>(key: K, value: Updater<ProfileState[K]>) => void;
  reset: () => void;
}

// Single typed store for the whole form. One `set(key, value | updater)` keeps
// the ~25 fields consolidated without a switch-heavy reducer, and reset always
// restores the exact defaults the form initialised with.
export function useProfileState(): ProfileStore {
  const [state, setState] = useState<ProfileState>(DEFAULT_STATE);

  const set = useCallback<ProfileStore["set"]>((key, value) => {
    setState((prev) => ({
      ...prev,
      [key]:
        typeof value === "function"
          ? (value as (p: ProfileState[typeof key]) => ProfileState[typeof key])(
              prev[key],
            )
          : value,
    }));
  }, []);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  return { state, set, reset };
}
