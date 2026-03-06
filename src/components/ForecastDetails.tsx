import { type Forecast } from "@/types/common";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from "@/components/ui/Table";

function formatWorldRankingDate(date: Date | string | undefined) {
  if (!date) return "-";

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: false,
  }).format(parsed);
}

export function ForecastDetails({ data }: { data: Forecast }) {
  return (
    <div className="collapse collapse-arrow mt-6 border border-slate-300 dark:border-slate-600">
      <input type="checkbox" />
      <div className="collapse-title font-semibold">Stats for nerds</div>
      <div className="collapse-content">
        <Table className="table-sm">
          <TableCaption>
            Latest world ranking update:{" "}
            {formatWorldRankingDate(data?.all?.worldRankingDate)}
          </TableCaption>

          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                WPRS two valid tasks:
              </TableCell>
              <TableCell>{data?.confirmed?.WPRS[0]?.Ta2}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                WPRS one valid task:
              </TableCell>
              <TableCell>{data?.confirmed?.WPRS[0]?.Ta1}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Max number of pilots:
              </TableCell>
              <TableCell>
                {data.maxPilots === 0 ? "?" : data.maxPilots}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Confirmed pilots:</TableCell>
              <TableCell>{data?.confirmed?.numPilots}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Number of participants (Pn):
              </TableCell>
              <TableCell>{data?.confirmed?.Pn}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Participant quality (Pq):{" "}
              </TableCell>
              <TableCell>{data?.confirmed?.Pq}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Comp ranking: </TableCell>
              <TableCell>{data?.confirmed?.compRanking}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Pq_srp:</TableCell>
              <TableCell>{data?.confirmed?.Pq_srp}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pq_srtp:</TableCell>
              <TableCell>{data?.confirmed?.Pq_srtp}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
