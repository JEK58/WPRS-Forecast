import { ForecastDetails } from "@/components/ForecastDetails";
import Link from "next/link";

import { type RouterOutputs } from "@/utils/api";
import { ListRankings } from "@/components/ForecastListRankings";

interface Props {
  onResetCompData: () => void;
  data: RouterOutputs["wprs"]["getWprs"];
}

export const ForecastView: React.FC<Props> = ({ data, onResetCompData }) => {
  return (
    <>
      <div className="justify-content-between flex items-start ">
        <div className="flex-grow">
          <h2 className="mb-2 text-lg font-bold sm:text-2xl dark:text-slate-200">
            {data.compTitle}
          </h2>
          {data.compUrl && (
            <Link
              className="flex items-center text-sm underline decoration-green-500 decoration-dotted hover:decoration-black dark:text-slate-300"
              target="_blank"
              href={data.compUrl}
            >
              Visit comp website
            </Link>
          )}
        </div>

        <button
          className="rounded-full px-0.5 py-0.5  hover:bg-green-500 focus:bg-gray-400 focus:outline-none"
          type="button"
          onClick={() => onResetCompData()}
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
      </div>

      <div className="text-lg">
        WPRS:{" "}
        <span className="font-bold text-green-500">
          {data?.confirmed?.WPRS[0]?.Ta3}
        </span>
      </div>
      <div className="text-sm">
        <ForecastDetails data={data} />
      </div>

      <Link
        className="text-sm underline decoration-green-500 decoration-dotted hover:decoration-black"
        target="_blank"
        href="https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf"
      >
        Details can be found in the FAI Sporting Code Section 7E
      </Link>
      <p className="text-sm">
        This forecast is based on the currently confirmed/registered pilots and
        their CIVL rankings. The calculation will become more accurate as the
        competition date approaches.
      </p>
      {data.confirmed?.WPRS.length && <ListRankings data={data} />}
    </>
  );
};
