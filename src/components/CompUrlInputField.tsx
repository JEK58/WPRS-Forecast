"use client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useEffect, useState, useCallback } from "react";
import { isValidUrl } from "@/utils/check-valid-url";
import Link from "next/link";
import { cn } from "@/utils/utils";

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
      <form className="mt-4 flex flex-col gap-2 md:flex-row md:gap-0">
        <div className="relative grow">
          <Input
            name="url"
            autoFocus
            ref={inputUrl}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input-lg h-12 pr-11 text-base md:rounded-r-none md:border-r-0"
            placeholder="Paste competition URL"
          />
          {url.length > 0 ? (
            <Button
              type="button"
              aria-label="Clear URL"
              onClick={() => setUrl("")}
              variant="ghost"
              size="sm"
              className="btn-circle absolute top-1/2 right-1 h-8 min-h-8 w-8 -translate-y-1/2 text-slate-500 hover:text-green-600 dark:text-slate-300 dark:hover:text-green-400"
            >
              <svg
                className="h-4 w-4"
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </Button>
          ) : (
            clipboardApiSupported && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="btn-circle absolute top-1/2 right-1 h-8 min-h-8 w-8 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                onClick={handlePaste}
              >
                <svg
                  className="h-4 w-4"
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

        <Button
          asChild
          size="lg"
          className={cn(
            "h-12 min-h-12 w-full md:w-auto md:self-center md:rounded-l-none md:px-6",
            "border-transparent bg-blue-500 text-white shadow-blue-900/10 hover:bg-blue-600",
            !isValidLink &&
              "btn-disabled pointer-events-none border-slate-300 bg-slate-300 text-slate-500 hover:bg-slate-300",
          )}
        >
          <Link
            href={`/forecast?url=${url}`}
            aria-disabled={!isValidLink}
            tabIndex={!isValidLink ? -1 : undefined}
          >
            Calculate
          </Link>
        </Button>
      </form>
      <div className="min-h-5 pt-1 text-sm text-red-500">
        {!isValidLink && url.length > 0 && <p>This is not a valid link</p>}
      </div>
    </>
  );
}
