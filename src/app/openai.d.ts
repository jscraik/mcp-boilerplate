import { SET_GLOBALS_EVENT_TYPE } from "./openai/types";

type CallTool = import("./openai/types").CallTool;
type RequestDisplayMode = import("./openai/types").RequestDisplayMode;
type OpenAiGlobals = import("./openai/types").OpenAiGlobals;
type SetGlobalsEvent = import("./openai/types").SetGlobalsEvent;

type API = {
  callTool: CallTool;
  sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;
  openExternal(payload: { href: string }): void;
  // // Layout controls
  requestDisplayMode: RequestDisplayMode;
};

/**
 * Global oai object injected by the web sandbox for communicating with chatgpt host page.
 */
declare global {
  interface Window {
    openai?: API & OpenAiGlobals;
  }

  interface WindowEventMap {
    [SET_GLOBALS_EVENT_TYPE]: SetGlobalsEvent;
  }
}

export {};
