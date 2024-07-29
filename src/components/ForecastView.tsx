import { ForecastDetails } from "@/components/ForecastDetails";
import Link from "next/link";
import { fetchForecastData } from "@/app/lib/data";
import { ListRankings } from "@/components/ForecastListRankings";
import { Nationalities } from "./ForecastNationalities";
import { LevelChart } from "./ForecastLevelChart";
import { Genders } from "./ForecastGenders";

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
      <div>
        <h2>{errMessage}</h2>
      </div>
    );
  }

  return (
    <>
      <div className="justify-content-between flex items-start">
        <div className="flex-grow">
          <h2 className="mb-1 text-lg font-bold sm:text-2xl dark:text-slate-200">
            {data.compTitle}
          </h2>
        </div>
        {/* Close button */}
        <Link href="/">
          <button
            className="rounded-full px-0.5 py-0.5 hover:bg-green-500 focus:bg-gray-400 focus:outline-none"
            type="button"
          >
            <svg
              className="h-6 w-6 fill-current stroke-black dark:stroke-white"
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
          </button>
        </Link>
      </div>
      {data.pilotsUrl && (
        <Link
          className="flex max-w-full items-center overflow-hidden overflow-ellipsis text-sm underline decoration-green-500 decoration-dotted hover:decoration-solid dark:text-slate-300"
          target="_blank"
          href={data.pilotsUrl}
        >
          {data.pilotsUrl}{" "}
        </Link>
      )}
      <div className="mt-4 font-semibold">
        WPRS:{" "}
        {data?.confirmed?.WPRS[0]?.Ta3 ? (
          <span className="font-semibold text-green-500">
            {data?.confirmed?.WPRS[0]?.Ta3}
          </span>
        ) : (
          <span>No confirmed pilots yet.</span>
        )}
      </div>

      {data.maxPilots && data.maxPilots > 0 && (
        <div className="mt-2">
          Potential WPRS:{" "}
          <span className="text-primary">{data?.all?.WPRS[0]?.Ta3}</span>
          <p className="text-sm">
            If the top {data.maxPilots} registered pilots would be confirmed.
          </p>
        </div>
      )}

      <p className="mt-4 text-sm">
        This forecast is based on the currently confirmed/registered pilots and
        their CIVL rankings. The calculation will become more accurate as the
        competition date approaches.
      </p>
      <div className="mt-2">
        <Link
          className="text-sm underline decoration-green-500 decoration-dotted hover:decoration-solid"
          target="_blank"
          href="https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf"
        >
          Details can be found in the FAI Sporting Code Section 7E
        </Link>
      </div>
      {!!data?.confirmed?.WPRS[0]?.Ta3 && <ForecastDetails data={data} />}

      {data.confirmed?.pilots && <LevelChart data={data.confirmed} />}
      {data.nationalities && <Nationalities data={data.nationalities} />}
      {data.genders && <Genders data={data.genders} />}
      {(data.nationalities ?? data.genders) && (
        <div className="mt-4 text-sm">
          The sum of pilots may not be equal to the number of confirmed pilots
          because of lookup mismatches.
        </div>
      )}

      {data.confirmed?.WPRS.length && <ListRankings data={data.confirmed} />}
    </>
  );
}
