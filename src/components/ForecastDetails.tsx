import { type Forecast } from "@/types/common";

export function ForecastDetails({ data }: { data: Forecast }) {
  const listClassName = "text-gray-500 dark:text-gray-300";
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
        <span className={listClassName}>{data?.confirmed?.WPRS[0]?.Ta2}</span>
      </li>
      <li>
        WPRS one valid task:{" "}
        <span className={listClassName}>{data?.confirmed?.WPRS[0]?.Ta1}</span>
      </li>
      <li>
        Number of participants (Pn):{" "}
        <span className={listClassName}>{data?.confirmed?.Pn}</span>
      </li>
      <li>
        Participant quality (Pq):{" "}
        <span className={listClassName}>{data?.confirmed?.Pq}</span>
      </li>

      <li>
        Comp ranking:{" "}
        <span className={listClassName}>{data?.confirmed?.compRanking}</span>
      </li>
      <li>
        Max number of pilots:{" "}
        <span className={listClassName}>
          {data.maxPilots === 0 ? "?" : data.maxPilots}
        </span>
      </li>
      <li>
        Number of pilots:{" "}
        <span className={listClassName}>{data?.confirmed?.numPilots}</span>
      </li>
      <li>
        Pq_srp: <span className={listClassName}>{data?.confirmed?.Pq_srp}</span>
      </li>
      <li>
        Pq_srtp:{" "}
        <span className={listClassName}>{data?.confirmed?.Pq_srtp}</span>
      </li>

      <li className="my-3 text-sm">
        Latest world ranking update:{" "}
        <span className={listClassName}>
          {new Date(data?.all?.worldRankingDate ?? "").toLocaleString()}
        </span>
      </li>
    </ul>
  );
}
