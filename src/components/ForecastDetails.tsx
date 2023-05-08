import { type GetWPRS } from "@/utils/calculate-wprs";

export function ForecastDetails({ data }: { data: GetWPRS }) {
  return (
    <ul>
      <li>
        WPRS if the top 150 registered pilots would be confirmed:{" "}
        <span className="text-[hsl(125,50%,56%)]">
          {data?.all?.WPRS[0]?.Ta3}
        </span>
      </li>
      <li>
        WPRS two valid tasks:{" "}
        <span className="text-slate-400">{data?.confirmed?.WPRS[0]?.Ta2}</span>
      </li>
      <li>
        WPRS one valid task:{" "}
        <span className="text-slate-400">{data?.confirmed?.WPRS[0]?.Ta1}</span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-slate-400">{data?.confirmed?.numPilots}</span>
      </li>
      <li>
        Number of participants (Pn):{" "}
        <span className="text-slate-400">{data?.confirmed?.Pn}</span>
      </li>
      <li>
        Participant quality (Pq):{" "}
        <span className="text-slate-400">{data?.confirmed?.Pq}</span>
      </li>

      <li>
        Comp ranking:{" "}
        <span className="text-slate-400">{data?.confirmed?.compRanking}</span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-slate-400">{data?.confirmed?.numPilots}</span>
      </li>
      <li>
        Pq_srp:{" "}
        <span className="text-slate-400">{data?.confirmed?.Pq_srp}</span>
      </li>
      <li>
        Pq_srtp:{" "}
        <span className="text-slate-400">{data?.confirmed?.Pq_srtp}</span>
      </li>

      <li className="mt-3">
        Latest world ranking update:{" "}
        <span className="text-slate-400">
          {new Date(data?.all?.worldRankingDate ?? "").toLocaleString()}
        </span>
      </li>
    </ul>
  );
}
