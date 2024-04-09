import Box from "@/components/ui/Box";
import { fetchHistory } from "../lib/data";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

export default async function History() {
  noStore();
  const data = await fetchHistory();

  const list = data.map((item) => {
    return (
      <li className="mb-2" key={item.id}>
        <p className="">{item.compTitle} </p>
        <p className="text-gray-500 dark:text-inherit">
          Forecast: <span className="me-1 text-green-500">{item.wprs}</span>
          <br />
          Actual: <span className="me-1 text-green-500">{item.actualWprs}</span>
          {item.tasks && item.tasks < 3 && (
            <span className="me-1">(Less than three tasks)</span>
          )}
        </p>
      </li>
    );
  });

  return (
    <>
      <div className="mx-auto flex w-full flex-col space-y-4 p-3 md:max-w-3xl">
        <Box>
          <h2 className="text-lg font-bold dark:text-slate-200">History</h2>

          <p className="mt-4">
            Compare the forecasted points to the points actually awarded in the
            official{" "}
            <Link
              className="text-green-500 hover:underline"
              target="_blank"
              href="https://civlcomps.org/ranking/paragliding-xc/competitions"
            >
              world ranking
            </Link>
            .
          </p>
          <p>
            This page is generated automatically. Some comps may be missing if
            the name on the comp website does not match the name in the world
            ranking.
          </p>
        </Box>
        <Box>
          <div>
            <ul>{list}</ul>
          </div>
        </Box>
      </div>
    </>
  );
}
