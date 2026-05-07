import { type Forecast } from "@/types/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export function ListRankings({ data }: { data: Forecast["confirmed"] }) {
  const listRanking = () => {
    if (!data?.WPRS.length) return;
    return data?.WPRS.map((el, i) => {
      return (
        <TableRow key={i}>
          <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
            {i + 1}
          </TableCell>
          <TableCell className="font-semibold text-green-600 dark:text-green-400">
            {el.Ta3}
          </TableCell>
          <TableCell className="text-slate-400 dark:text-slate-300">
            {el.Ta2}
          </TableCell>
          <TableCell className="text-slate-400 dark:text-slate-300">
            {el.Ta1}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <details className="collapse-arrow collapse mt-5 rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/35">
      <summary className="collapse-title cursor-pointer list-none font-semibold text-slate-900 dark:text-slate-100">
        Show points for every position
      </summary>
      <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-slate-400 dark:text-slate-300">
                  2 Tasks
                </TableHead>
                <TableHead className="text-slate-400 dark:text-slate-300">
                  1 Task
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{listRanking()}</TableBody>
          </Table>
        </div>
      </div>
    </details>
  );
}
