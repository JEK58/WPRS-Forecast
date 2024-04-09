import { type Forecast } from "@/types/common";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableRow,
} from "@/components/ui/Table";

export function ForecastDetails({ data }: { data: Forecast }) {
  return (
    <div className="collapse collapse-arrow mt-6 rounded-box border border-slate-300 ">
      <input type="checkbox" />
      <div className="collapse-title font-medium">Stats for nerds</div>
      <div className="collapse-content">
        <Table>
          <TableCaption>
            Latest world ranking update:{" "}
            {new Date(data?.all?.worldRankingDate ?? "").toLocaleString()}
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
