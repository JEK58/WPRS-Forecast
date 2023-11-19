import { sanitizeUrl } from "@braintree/sanitize-url";
import { type RecentQueriesProps } from "@/pages/index";
import { Button } from "@/components/ui/Button";
import { animateScroll } from "react-scroll";

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/Table";

interface Props {
  onUpdateButtonClick: (url: string) => void;
  recentQueries: RecentQueriesProps["recentQueries"];
  disableUpdateButton: boolean;
}

const RecentQueriesTable = ({
  recentQueries,
  onUpdateButtonClick,
  disableUpdateButton,
}: Props) => {
  const handleUpdate = (url: string) => {
    onUpdateButtonClick(url);
    animateScroll.scrollToTop({
      delay: 100,
      duration: 500,
      smooth: true,
    });
  };

  const uniqueQueries = recentQueries.filter(
    (item, index, self) =>
      index === self.findIndex((i) => i.compTitle === item.compTitle),
  );

  const recentQueriesTableRows = uniqueQueries?.map((stat) => {
    return (
      <TableRow key={stat.id} className="dark:border-slate-600">
        <TableCell>
          <a
            className="decoration-green-500 hover:underline hover:decoration-dotted"
            href={sanitizeUrl(stat.compUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {stat.compTitle ?? stat.compUrl}
          </a>
        </TableCell>
        <TableCell>{stat.wprs}</TableCell>
        <TableCell>{formatAge(stat.ageInHours)}</TableCell>
        <TableCell className="text-right">
          <Button
            className="md:text-md rounded bg-green-500 px-2 py-1 font-bold text-white hover:bg-green-700 sm:text-xs"
            onClick={() => handleUpdate(stat.compUrl)}
            disabled={disableUpdateButton}
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
        </TableCell>
      </TableRow>
    );
  });

  return (
    <>
      <h2 className="text-lg font-bold dark:text-slate-200">Recent Queries</h2>
      <div className="w-full overflow-x-auto">
        <Table className="text-lef w-full">
          <TableHeader>
            <TableRow className="dark:border-slate-600">
              <TableHead></TableHead>
              <TableHead>WPRS</TableHead>
              <TableHead>Updated</TableHead>
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
