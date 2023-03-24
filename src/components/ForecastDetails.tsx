import { type CompForecast } from "@/utils/calculate-wprs";

export function ForecastDetails({ data }: { data: CompForecast }) {
  return (
    <ul>
      <li>
        WPRS two valid tasks:{" "}
        <span className="text-slate-400">{data.wprDeval0_8}</span>
      </li>
      <li>
        WPRS one valid task:{" "}
        <span className="text-slate-400">{data.wprDeval0_5}</span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-slate-400">{data.numPilots}</span>
      </li>
      <li>
        Number of participants (Pn):{" "}
        <span className="text-slate-400">{data.Pn}</span>
      </li>
      <li>
        Pilot Points (Pp): <span className="text-slate-400">{data.Pp}</span>
      </li>
      <li>
        Participant quality (Pq):{" "}
        <span className="text-slate-400">{data.Pq}</span>
      </li>

      <li>
        Comp ranking: <span className="text-slate-400">{data.compRanking}</span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-slate-400">{data.numPilots}</span>
      </li>
      <li>
        Pq_srp: <span className="text-slate-400">{data.Pq_srp}</span>
      </li>
      <li>
        Pq_srtp: <span className="text-slate-400">{data.Pq_srtp}</span>
      </li>

      <li className="mt-3">
        Latest world ranking update:{" "}
        <span className="text-slate-400">
          {" "}
          {new Date(data.worldRankingDate).toLocaleString()}
        </span>
      </li>
    </ul>
  );
}
