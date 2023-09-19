import { ForecastDetails } from "@/components/ForecastDetails";
import Link from "next/link";

import { type RouterOutputs } from "@/utils/api";
import { ListRankings } from "@/components/ListRankings";

interface Props {
  onResetCompData: () => void;
  data: RouterOutputs["wprs"]["getWprs"];
}

export const ForecastView: React.FC<Props> = ({ data, onResetCompData }) => {
  return (
    <div className="flex max-w-lg flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
      <div className="justify-content-between flex items-start ">
        <div className="flex-grow">
          <h2 className="text-lg font-bold text-white sm:text-2xl">
            {data.compTitle}
          </h2>
          {data.compUrl && (
            <Link
              className="flex items-center text-sm text-primary hover:underline hover:decoration-dotted"
              target="_blank"
              href={data.compUrl}
            >
              Visit comp website
            </Link>
          )}
        </div>

        <button
          className="rounded-full px-0.5 py-0.5 text-white hover:bg-primary focus:bg-gray-400 focus:outline-none"
          type="button"
          onClick={() => onResetCompData()}
        >
          <svg
            className="h-6 w-6 fill-current"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.4 6.4l7.2 7.2m0-7.2l-7.2 7.2"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="text-lg">
        WPRS:{" "}
        <span className="font-bold text-primary">
          {data?.confirmed?.WPRS[0]?.Ta3}
        </span>
      </div>
      <div className="text-sm text-slate-100">
        <ForecastDetails data={data} />
      </div>

      <Link
        className="text-sm text-primary hover:underline hover:decoration-dotted"
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
    </div>
  );
};
