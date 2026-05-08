import { sanitizeUrl } from "@braintree/sanitize-url";
import { Button } from "@/components/ui/Button";
import { fetchRecentQueries } from "@/app/lib/data";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/Table";

const MAX_TITLE_LENGTH = 45;

const RecentQueriesTable = async () => {
  noStore();
  const uniqueQueries = await fetchRecentQueries();

  const recentQueriesTableRows = uniqueQueries?.map((stat) => {
    let compTitle = stat.compTitle ?? stat.compUrl;
    if (compTitle.length > MAX_TITLE_LENGTH) {
      compTitle = compTitle.substring(0, MAX_TITLE_LENGTH) + "...";
    }

    return (
      <TableRow key={stat.id}>
        <TableCell className="w-[42%] max-w-0 px-2 font-medium sm:w-auto sm:max-w-none sm:px-3">
          <a
            className="block min-w-0 overflow-hidden break-words text-slate-800 decoration-green-500 hover:text-green-700 hover:underline hover:decoration-dotted dark:text-slate-100 dark:hover:text-green-300"
            href={sanitizeUrl(stat.compUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {compTitle}
          </a>
        </TableCell>
        <TableCell className="w-[18%] px-2 sm:w-auto sm:px-3">
          {!!stat.daysTillCompStart && stat.daysTillCompStart > 0 ? (
            <span className="block leading-tight font-normal text-gray-400">
              {stat.daysTillCompStart}{" "}
              {stat.daysTillCompStart != 1 ? "days" : "day"}
            </span>
          ) : null}

          {/* {stat.daysSinceCompEnd && stat.daysSinceCompEnd < 0 && (
            <span className="font-normal text-gray-400"></span>
          )} */}
        </TableCell>
        <TableCell className="w-[18%] px-2 font-mono text-sm font-bold tabular-nums sm:w-auto sm:px-3">
          <span className="hidden whitespace-nowrap text-green-600 sm:inline dark:text-green-400">
            {stat.wprs ?? "---"}
            {stat.potentialWprs && (
              <span className="font-normal text-slate-400">
                {" "}
                | {stat.potentialWprs}
              </span>
            )}
          </span>
          <span className="flex flex-col leading-tight whitespace-nowrap sm:hidden">
            <span className="text-green-600 dark:text-green-400">
              {stat.wprs ?? "---"}
            </span>
            {stat.potentialWprs && (
              <span className="mt-1 text-xs font-normal text-slate-400">
                {stat.potentialWprs}
              </span>
            )}
          </span>
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {formatAge(stat.ageInHours)}
        </TableCell>
        <TableCell className="w-12 px-1 text-right sm:w-auto sm:px-3">
          <Button
            asChild
            aria-label="Update"
            size="sm"
            className="h-9 min-h-9 w-9 border-transparent bg-green-500 p-0 text-white hover:bg-green-600 sm:w-auto sm:px-3"
          >
            <Link href={`/forecast?url=${stat.compUrl}`}>
              <span className="hidden sm:inline">Update</span>
              <svg
                className="inline sm:hidden"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </Link>
          </Button>
        </TableCell>
      </TableRow>
    );
  });

  return (
    <>
      <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
        Recent Queries
      </h2>
      <div className="min-w-0 w-full overflow-hidden">
        <Table className="w-full table-fixed text-left sm:table-auto [&_tbody_tr:hover]:bg-white/60 dark:[&_tbody_tr:hover]:bg-slate-900/35">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[42%] px-2 sm:w-auto sm:px-3">
                Competition
              </TableHead>
              <TableHead className="w-[18%] px-2 sm:w-auto sm:px-3">
                Begins
              </TableHead>
              <TableHead className="w-[18%] px-2 sm:w-auto sm:px-3">
                WPRS
              </TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
              <TableHead className="w-12 px-1 sm:w-auto sm:px-3" />
            </TableRow>
          </TableHeader>
          <TableBody>{recentQueriesTableRows}</TableBody>
        </Table>
      </div>
    </>
  );
};

const formatAge = (hours: number) => {
  if (hours < 1) return "< 1h";
  if (hours < 8) return "< 8h";
  if (hours < 24) return "< 24h";
  return "> 24h";
};
export default RecentQueriesTable;
