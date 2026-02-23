import Box from "@/components/ui/Box";
import { fetchHistory } from "../lib/data";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function History() {
  noStore();
  const data = await fetchHistory();

  const list = data.map((item) => {
    return (
      <li className="mb-2" key={item.id}>
        <p>{item.compTitle}</p>
        <p className="text-gray-500">
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
    <PageContainer>
      <Box>
        <h2 className="card-title">History</h2>
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
        <ul>{list}</ul>
      </Box>
    </PageContainer>
  );
}
