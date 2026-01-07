export type GlobalOutput = {
  Input?: unknown;
  Output?: unknown;
  Metadata?: unknown;
  State?: unknown;
};

export type DefaultGlobalOutputs = {
  Input: UnknownObject;
  Output: UnknownObject;
  Metadata: UnknownObject;
  State: UnknownObject;
};

export type OpenAiGlobals<T extends GlobalOutput = DefaultGlobalOutputs> = {
  // visuals
  theme: Theme;

  userAgent: UserAgent;
  locale: string;

  // layout
  maxHeight: number;
  displayMode: DisplayMode;
  safeArea: SafeArea;

  // state
  toolInput: T["Input"];
  toolOutput: T["Output"] | null;
  toolResponseMetadata: T["Metadata"] | null;
  widgetState: T["State"] | null;
  setWidgetState: (state: T["State"]) => Promise<void>;
};

export type UnknownObject = Record<string, unknown>;

export type Theme = "light" | "dark";

export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type SafeArea = {
  insets: SafeAreaInsets;
};

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type UserAgent = {
  device: { type: DeviceType };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
};

/** Display mode */
export type DisplayMode = "pip" | "inline" | "fullscreen";
export type RequestDisplayMode = (args: { mode: DisplayMode }) => Promise<{
  /**
   * The granted display mode. The host may reject the request.
   * For mobile, PiP is always coerced to fullscreen.
   */
  mode: DisplayMode;
}>;

export type CallToolResponse = {
  result: string;
  structuredContent?: Record<string, unknown> | null;
  isError: boolean;
  meta?: Record<string, unknown> | null;
  _meta?: Record<string, unknown> | null;
};

/** Calling APIs */
export type CallTool = (
  name: string,
  args: Record<string, unknown>
) => Promise<CallToolResponse>;

/** Extra events */
export const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

export class SetGlobalsEvent<T extends GlobalOutput> extends CustomEvent<{
  globals: Partial<OpenAiGlobals<T>>;
}> {
  readonly type = SET_GLOBALS_EVENT_TYPE;
}
