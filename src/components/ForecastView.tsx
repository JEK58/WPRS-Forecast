import Link from "next/link";
import { fetchForecastData } from "@/app/lib/data";
import { ForecastInteractive } from "./ForecastInteractive";

export async function ForecastView({ url }: { url?: string }) {
  const data = await fetchForecastData(url);

  if ("error" in data) {
    const err = data.error;
    let errMessage = "Something went wrong. Please try again.";

    if (err === "NO_URL") errMessage = "No valid URL submitted";
    if (err === "PAST_EVENT") errMessage = "Competition date is in the past";
    if (err === "NOT_ENOUGH_PILOTS")
      errMessage = "Not enough pilots in this comp.";
    if (err === "UNSUPPORTED_PLATFORM") errMessage = "No valid URL submitted.";
    if (err === "SOMETHING_WENT_WRONG")
      errMessage = "Something went wrong. Please try again.";

    return (
      <div role="alert" className="alert alert-error">
        <span>{errMessage}</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="grow">
          <h2 className="mb-1 text-xl font-bold sm:text-2xl dark:text-slate-200">
            {data.compTitle}
          </h2>
        </div>
        <Link
          href="/"
          aria-label="Close forecast"
          className="btn btn-circle btn-ghost btn-sm text-black dark:text-white"
        >
          <svg
            className="h-5 w-5 fill-current stroke-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.4 6.4l7.2 7.2m0-7.2l-7.2 7.2"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
      {data.pilotsUrl && (
        <Link
          className="mt-1 block max-w-full truncate text-sm underline decoration-green-500 decoration-dotted hover:decoration-solid dark:text-slate-300"
          target="_blank"
          href={data.pilotsUrl}
        >
          {data.pilotsUrl}{" "}
        </Link>
      )}
      <ForecastInteractive key={data.compUrl} data={data} />
    </>
  );
}
