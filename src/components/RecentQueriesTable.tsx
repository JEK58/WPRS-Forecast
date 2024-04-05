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
  const recentQueries = await fetchRecentQueries();

  const uniqueQueries = recentQueries
    .filter(
      (item, index, self) =>
        index === self.findIndex((i) => i.compTitle === item.compTitle),
    )
    .slice(0, 30);
  console.log("🚀 ~ uniqueQueries:", uniqueQueries);

  const recentQueriesTableRows = uniqueQueries?.map((stat) => {
    let compTitle = stat.compTitle ?? stat.compUrl;
    if (compTitle.length > MAX_TITLE_LENGTH) {
      compTitle = compTitle.substring(0, MAX_TITLE_LENGTH) + "...";
    }

    return (
      <TableRow
        key={stat.id}
        className="border-slate-300 dark:border-slate-600"
      >
        <TableCell>
          <a
            className="decoration-green-500 hover:underline hover:decoration-dotted"
            href={sanitizeUrl(stat.compUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {compTitle}
          </a>
        </TableCell>
        <TableCell>
          {!!stat.daysTillCompStart && stat.daysTillCompStart > 0 ? (
            <span className="font-normal text-gray-400">
              {stat.daysTillCompStart}{" "}
              {stat.daysTillCompStart != 1 ? "days" : "day"}
            </span>
          ) : null}

          {/* {stat.daysSinceCompEnd && stat.daysSinceCompEnd < 0 && (
            <span className="font-normal text-gray-400"></span>
          )} */}
        </TableCell>
        <TableCell className="font-bold text-green-500">
          {stat.wprs ?? "---"}
          {stat.potentialWprs && (
            <span className="font-normal text-gray-400">
              {" "}
              | {stat.potentialWprs}
            </span>
          )}
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          {formatAge(stat.ageInHours)}
        </TableCell>
        <TableCell className="text-right">
          <Link href={`/forecast?url=${stat.compUrl}`}>
            <Button
              aria-label="Update"
              className="md:text-md rounded bg-green-500 px-2 py-1 font-bold text-white hover:bg-green-700 sm:text-xs"
            >
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
            </Button>
          </Link>
        </TableCell>
      </TableRow>
    );
  });

  return (
    <>
      <h2 className="text-lg font-bold dark:text-slate-200">Recent Queries</h2>
      <div className="w-full overflow-x-auto">
        <Table className="w-full text-left">
          <TableHeader>
            <TableRow className="dark:border-slate-600">
              <TableHead></TableHead>
              <TableHead>Begins</TableHead>
              <TableHead>WPRS</TableHead>
              <TableHead className="hidden sm:table-cell">Updated</TableHead>
              <TableHead />
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
