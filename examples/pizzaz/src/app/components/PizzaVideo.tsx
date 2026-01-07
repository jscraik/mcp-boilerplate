import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { useOpenAIGlobal } from "../openai/hooks/useOpenAIGlobal";

import "../index.css";

export function PizzaVideo() {
  const displayMode = useOpenAIGlobal("displayMode");
  const maxHeight = useOpenAIGlobal("maxHeight");

  const containerHeight =
    displayMode === "fullscreen"
      ? maxHeight
        ? maxHeight - 40
        : undefined
      : 480;

  return (
    <div
      style={{
        maxHeight,
        height: containerHeight,
      }}
      className={
        "relative antialiased w-full overflow-hidden bg-black flex items-center justify-center " +
        (displayMode === "fullscreen"
          ? "rounded-none border-0"
          : "border border-black/10 rounded-2xl sm:rounded-3xl")
      }
    >
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          <div className="mt-6 text-center text-white">
            <h2 className="text-2xl font-semibold mb-2">
              How to Make Perfect Pizza
            </h2>
            <p className="text-white/70">
              Learn the secrets of authentic Italian pizza making
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <PizzaVideo />
    </StrictMode>
  );
}
