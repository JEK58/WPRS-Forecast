import { type CompForecast } from "@/utils/calculate-wprs";

export function ForecastDetails({ data }: { data: CompForecast }) {
  return (
    <ul>
      <li>
        Pn: <span className="text-slate-400">{data.Pn}</span>
      </li>
      <li>
        Pp: <span className="text-slate-400">{data.Pp}</span>
      </li>
      <li>
        Pq: <span className="text-slate-400">{data.Pq}</span>
      </li>
      <li>
        Pq_srp: <span className="text-slate-400">{data.Pq_srp}</span>
      </li>
      <li>
        Pq_srtp: <span className="text-slate-400">{data.Pq_srtp}</span>
      </li>
      <li>
        Comp ranking: <span className="text-slate-400">{data.compRanking}</span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-slate-400">{data.numPilots}</span>
      </li>
    </ul>
  );
}
