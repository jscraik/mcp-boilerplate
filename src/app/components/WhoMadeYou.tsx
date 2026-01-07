import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../index.css";

export function WhoMadeYou() {
  return (
    <div className="antialiased w-full text-black p-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full flex flex-col items-center gap-12">
        <h1 className="font-bold text-lg">Hi there!</h1>
        <p>
          This template was created by{" "}
          <a
            href="https://x.com/gching"
            target="_blank"
            className="font-medium text-blue-600 underline dark:text-blue-500 hover:no-underline"
          >
            some nerd
          </a>
          .
        </p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <WhoMadeYou />
    </StrictMode>
  );
}
