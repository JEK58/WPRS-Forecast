import { type Forecast } from "@/utils/calculate-wprs";

export function ListRankings({ data }: { data: Forecast }) {
  const listRanking = () => {
    if (!data.confirmed?.WPRS.length) return;
    return data?.confirmed?.WPRS.map((el, i) => {
      return (
        <tr key={i} className="">
          <td>{i + 1}</td>
          <td className="text-primary">{el.Ta3}</td>
          <td className="text-slate-400">{el.Ta2}</td>
          <td className="text-slate-400">{el.Ta1}</td>
        </tr>
      );
    });
  };

  return (
    <>
      <div className="collapse collapse-arrow mt-3 rounded-box border ">
        <input type="checkbox" />
        <div className="collapse-title font-medium">
          Show points for every position
        </div>
        <div className="collapse-content">
          <div className="">
            <table className="table-auto border-separate border-spacing-x-2">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Points</th>
                  <th className=" text-slate-400">2 Tasks</th>
                  <th className=" text-slate-400">1 Task</th>
                </tr>
              </thead>
              <tbody>{listRanking()}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
