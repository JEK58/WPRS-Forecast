import { type GetWPRS } from "@/utils/calculate-wprs";

export function ListRankings({ data }: { data: GetWPRS }) {
  const listRanking = () => {
    if (!data.confirmed?.WPRS.length) return;
    return data?.confirmed?.WPRS.map((el, i) => {
      return (
        <tr key={el.Ta3 + i} className="">
          <td>{i + 1}</td>
          <td className="text-[hsl(125,50%,56%)]">{el.Ta3}</td>
        </tr>
      );
    });
  };

  return (
    <>
      <div className="collapse-arrow rounded-box collapse mt-3 border ">
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
