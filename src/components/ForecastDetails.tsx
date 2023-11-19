import { type Forecast } from "@/utils/calculate-wprs";

export function ForecastDetails({ data }: { data: Forecast }) {
  return (
    <ul className="text-base">
      {data.maxPilots && data.maxPilots > 0 && (
        <li>
          WPRS if the top {data.maxPilots} registered pilots would be confirmed:{" "}
          <span className="text-primary">{data?.all?.WPRS[0]?.Ta3}</span>
        </li>
      )}
      <li>
        WPRS two valid tasks:{" "}
        <span className="text-gray-500">{data?.confirmed?.WPRS[0]?.Ta2}</span>
      </li>
      <li>
        WPRS one valid task:{" "}
        <span className="text-gray-500">{data?.confirmed?.WPRS[0]?.Ta1}</span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-gray-500">{data?.confirmed?.numPilots}</span>
      </li>
      <li>
        Number of participants (Pn):{" "}
        <span className="text-gray-500">{data?.confirmed?.Pn}</span>
      </li>
      <li>
        Participant quality (Pq):{" "}
        <span className="text-gray-500">{data?.confirmed?.Pq}</span>
      </li>

      <li>
        Comp ranking:{" "}
        <span className="text-gray-500">{data?.confirmed?.compRanking}</span>
      </li>
      <li>
        Max number of pilots:{" "}
        <span className="text-gray-500">
          {data.maxPilots === 0 ? "?" : data.maxPilots}
        </span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className="text-gray-500">{data?.confirmed?.numPilots}</span>
      </li>
      <li>
        Pq_srp: <span className="text-gray-500">{data?.confirmed?.Pq_srp}</span>
      </li>
      <li>
        Pq_srtp:{" "}
        <span className="text-gray-500">{data?.confirmed?.Pq_srtp}</span>
      </li>

      <li className="my-3 text-sm">
        Latest world ranking update:{" "}
        <span className="text-gray-500">
          {new Date(data?.all?.worldRankingDate ?? "").toLocaleString()}
        </span>
      </li>
    </ul>
  );
}
