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
          <TableCell>{i + 1}</TableCell>
          <TableCell className="font-semibold text-green-500">{el.Ta3}</TableCell>
          <TableCell className="text-slate-400 dark:text-slate-300">{el.Ta2}</TableCell>
          <TableCell className="text-slate-400 dark:text-slate-300">{el.Ta1}</TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="collapse collapse-arrow mt-4 border border-slate-300 dark:border-slate-600">
      <input type="checkbox" />
      <div className="collapse-title font-semibold">
        Show points for every position
      </div>
      <div className="collapse-content">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Points</TableHead>
                <TableHead className="text-slate-400 dark:text-slate-300">2 Tasks</TableHead>
                <TableHead className="text-slate-400 dark:text-slate-300">1 Task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{listRanking()}</TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
