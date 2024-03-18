"use client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useEffect, useState, useCallback } from "react";
import { isValidUrl } from "@/utils/check-valid-url";
import Link from "next/link";

export function CompUrlInputField() {
  const [url, setUrl] = useState("");
  const [clipboardApiSupported, setClipboardApiSupported] = useState(false);

  const isValidLink = isValidUrl(url);

  // Only show the paste button when the browser supports reading from clipboard.
  // useEffect is needed to prevent a hydration error bc ".navigator" is only available in the browser
  useEffect(() => {
    setClipboardApiSupported(
      typeof navigator.clipboard !== "undefined" &&
        typeof navigator.clipboard.readText === "function",
    );
  }, []);

  const handlePaste = async (event?: React.FormEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    if (!clipboardApiSupported) return;
    await navigator.clipboard
      .readText()
      .then((text) => setUrl(text))
      .catch((error) => console.log(error));
  };

  // Autofocus input textbox
  const inputUrl = useCallback((inputElement: HTMLInputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  return (
    <>
      <form className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
        <div className="relative flex-grow">
          <Input
            name="url"
            autoFocus
            ref={inputUrl}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-12 w-full rounded-md border-2 border-gray-300 p-2 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 "
            placeholder="CIVL, PWC, Airtribune or Swissleague"
          />
          {/* Paste/Clear button */}
          {url.length > 0 ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded  px-2 py-1 font-bold text-gray-500 hover:text-green-500"
            >
              X
            </button>
          ) : (
            // Only show the button when the browser supports reading from clipboard.
            clipboardApiSupported && (
              <Button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded bg-transparent px-2 py-1 font-bold text-gray-500 hover:text-gray-700"
                onClick={handlePaste}
              >
                <svg
                  className=" h-4 w-4"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect height="4" rx="1" ry="1" width="8" x="8" y="2" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
                <span className="sr-only">Paste from clipboard</span>
              </Button>
            )
          )}
        </div>

        <Link
          href={`/forecast?url=${url}`}
          className={!isValidLink ? "pointer-events-none" : ""}
          aria-disabled={!isValidLink}
          tabIndex={!isValidLink ? -1 : undefined}
        >
          <Button
            className="h-12 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 md:self-center"
            type="submit"
            disabled={!isValidLink}
          >
            Calculate
          </Button>
        </Link>
      </form>
      {/* Error message */}
      <div className="text-sm text-red-500">
        {!isValidLink && url.length > 0 && <p>This is not a valid link</p>}
      </div>
    </>
  );
}
