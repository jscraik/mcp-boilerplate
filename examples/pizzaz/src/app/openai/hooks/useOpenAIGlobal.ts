import { useSyncExternalStore } from "react";

import { SET_GLOBALS_EVENT_TYPE } from "../types";

import type { GlobalOutput, OpenAiGlobals, SetGlobalsEvent } from "../types";

export function useOpenAIGlobal<
  T extends GlobalOutput,
  K extends keyof OpenAiGlobals<T>,
>(key: K): OpenAiGlobals<T>[K] | undefined {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleSetGlobal = (event: SetGlobalsEvent<T>) => {
        const value = event.detail.globals[key];
        if (value === undefined) {
          return;
        }

        onChange();
      };

      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal, {
        passive: true,
      });

      return () => {
        window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
      };
    },
    () => (window.openai as OpenAiGlobals<T>)?.[key],
    () => (window.openai as OpenAiGlobals<T>)?.[key]
  );
}
