import { useCallback } from "react";

import { useOpenAIGlobal } from "./useOpenAIGlobal";

import type { SetStateAction } from "react";

// Implementation
export function useWidgetState<T extends Record<string, unknown>>(): readonly [
  T | null | undefined,
  (state: SetStateAction<T | null | undefined>) => void,
] {
  // 1. Get the live state and the global setter function
  const currentState = useOpenAIGlobal<{ State: T }, "widgetState">(
    "widgetState"
  );
  const globalSetter = useOpenAIGlobal<{ State: T }, "setWidgetState">(
    "setWidgetState"
  );

  // 2. Determine the state to return, respecting precedence
  // (Global state > default state)

  // 3. Create a stable, React-like setter function
  const setState = useCallback(
    (action: SetStateAction<T | null | undefined>) => {
      if (!globalSetter) {
        console.warn("setWidgetState is not available on window.openai");
        return;
      }

      // Calculate the new state, supporting updater functions
      const newState =
        typeof action === "function"
          ? action(currentState) // Pass the current state to the updater
          : action;

      if (newState != null) {
        globalSetter(newState).catch((err) =>
          console.warn("setWidgetState could not be set on window.openai", err)
        );
      }
    },
    [globalSetter, currentState]
  ); // `state` is a dependency to correctly resolve updater functions

  return [currentState, setState] as const;
}
