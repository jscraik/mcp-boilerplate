import { useOpenAIGlobal } from "./useOpenAIGlobal";

export function useWidgetProps<T extends Record<string, unknown>>(): {
  data: T | undefined;
  isLoading: boolean;
} {
  const toolOutput = useOpenAIGlobal<{ Output: T }, "toolOutput">("toolOutput");

  if (toolOutput) {
    return {
      data: toolOutput,
      isLoading: false,
    };
  }

  return { data: undefined, isLoading: true };
}
