import Box from "@/components/ui/Box";
import Head from "next/head";
import { prisma } from "@/server/db";
import { type InferGetServerSidePropsType } from "next";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export type RecentQueriesProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>;

export default function Home(props: RecentQueriesProps) {
  const list = props.history.map((item) => {
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
      <Head>
        <title>WPRS Forecast</title>
        <meta
          name="description"
          content="Enables you to forecast the potential world ranking points for paragliding competitions."
        />
        <meta name="theme-color" content="#4ade80" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex min-h-screen flex-col bg-gradient-to-r from-green-400 to-blue-500 pb-4">
        <div className="flex flex-col items-center justify-center space-y-8 px-0 py-4 md:px-4">
          <h1 className="mt-6 text-6xl font-bold text-white sm:text-center sm:text-[5rem] sm:leading-tight">
            WPRS
            <span className="block text-green-300 sm:inline">Forecast</span>
            <span className="block text-right text-sm tracking-normal sm:inline sm:text-left">
              beta
            </span>
          </h1>
          <div className="mx-auto flex w-full flex-col space-y-4 p-3 md:max-w-3xl">
            <Box>
              <h2 className="text-lg font-bold dark:text-slate-200">History</h2>

              <p>
                Compare the forecasted points to the points actually awarded in
                the official{" "}
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
                This page is generated automatically. Some comps may be missing
                if the name on the comp website does not match the name in the
                world ranking.
              </p>
            </Box>
            <Box>
              <div>
                <ul>{list}</ul>
              </div>
            </Box>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

export const getServerSideProps = async () => {
  const MAX_DAYS_AGO = 120;

  try {
    const searchDateDaysAgo = new Date();
    searchDateDaysAgo.setDate(searchDateDaysAgo.getDate() - MAX_DAYS_AGO);

    const compsInRanking = await prisma.compRanking.findMany({
      where: { resultsUpdated: { gt: searchDateDaysAgo } },
      select: { name: true, winnerScore: true, tasks: true },
    });

    const compNames = compsInRanking.map((comp) => comp.name);

    const data = await prisma.usage.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        potentialWprs: { not: null },
        NOT: [{ wprs: null }],
      },
      select: {
        wprs: true,
        id: true,
        compTitle: true,
        createdAt: true,
      },
    });

    const trimmedCompNames = compNames.map((name) => name.trim().toLowerCase());

    const filteredData = data.filter((item) => {
      if (!item.compTitle) return false;
      return trimmedCompNames.includes(item.compTitle.trim().toLowerCase());
    });

    const history = filteredData
      // Convert createdAt to milliseconds because of serialization issues with dates
      .map(({ createdAt, ...rest }) => {
        return { createdAt: createdAt.getTime(), ...rest };
      })
      // Filter out duplicate entries (due to sort only the most recent one stays)
      .filter(
        (item, index, self) =>
          index === self.findIndex((i) => i.compTitle === item.compTitle),
      )
      // Add wprs and # of tasks to each entry
      .map((el) => {
        const actualWprs = compsInRanking.find(
          (comp) =>
            comp.name.toLowerCase().trim() ===
            el.compTitle?.toLowerCase().trim(),
        )?.winnerScore;
        const tasks = compsInRanking.find(
          (comp) =>
            comp.name.toLowerCase().trim() ===
            el.compTitle?.toLowerCase().trim(),
        )?.tasks;
        return {
          ...el,
          actualWprs,
          tasks,
        };
      })

      // sort by date
      .sort((a, b) => b.createdAt - a.createdAt);

    return { props: { history } };
  } catch (error) {
    console.log(error);
    return { props: { history: [] } };
  }
};
