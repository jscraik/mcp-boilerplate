import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import reactLogo from "../assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "../assets/cloudflare.svg";
import openaiLogo from "../assets/openai.svg";

import "../index.css";

type WhoYou = {
  description: string;
  authorsXSocialLink: string;
};

export function HelloWorld() {
  const [whoYou, setWhoYou] = useState<WhoYou>();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    if (isLoading || whoYou) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await window.openai?.callTool("who-made-you", {});
      if (!response?.structuredContent) {
        return;
      }

      setWhoYou(response.structuredContent as WhoYou);
    } catch (e) {
      console.error(e);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="antialiased w-full text-black p-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full flex flex-col items-center gap-12">
        <div className="flex flex-row gap-12">
          <a href="https://openai.com/" target="_blank">
            <img src={openaiLogo} className="w-10 h-10" alt="OpenAI logo" />
          </a>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="w-10 h-10" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="w-10 h-10" alt="React logo" />
          </a>
          <a href="https://workers.cloudflare.com/" target="_blank">
            <img
              src={cloudflareLogo}
              className="w-10 h-10"
              alt="Cloudflare logo"
            />
          </a>
        </div>
        <h1 className="font-bold text-lg">
          OpenAI Apps + Vite + React + Cloudflare
        </h1>
        <p>A template to start working with OpenAI's Apps SDK for ChatGPT.</p>
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            onClick();
          }}
          className="cursor-pointer text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
        >
          Who made you?
        </button>
        {isLoading && (
          <div role="status">
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
        {whoYou && (
          <p>
            This template was created by{" "}
            <a
              href={whoYou.authorsXSocialLink}
              target="_blank"
              className="font-medium text-blue-600 underline dark:text-blue-500 hover:no-underline"
            >
              some nerd
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <HelloWorld />
    </StrictMode>
  );
}
