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
    // const date = new Date(item.createdAt).toISOString();
    return (
      <li key={item.id}>
        {item.compTitle}:{" "}
        <span className="me-1 text-green-500">{item.wprs}</span>
        {/* <span className="me-1 text-red-500">{date}</span> */}
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
              <div className="border-t border-gray-200 py-2 dark:border-slate-600">
                <ul className="text-gray-500 dark:text-inherit">{list}</ul>
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
  try {
    const data = await prisma.usage.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        potentialWprs: { not: null },
        NOT: [{ compTitle: null }, { compTitle: "" }, { wprs: null }],
      },
      select: {
        wprs: true,
        id: true,
        compTitle: true,
        createdAt: true,
      },
      // take: 100,
    });
    const history = data
      // Convert createdAt to milliseconds because of serialization issues with dates
      .map(({ createdAt, ...rest }) => {
        return { createdAt: createdAt.getTime(), ...rest };
      })
      // Filter out duplicate entries (due to sort only the most recent one stays)
      .filter(
        (item, index, self) =>
          index === self.findIndex((i) => i.compTitle === item.compTitle),
      )
      // Filter our entries newer then the past month
      .filter((item) => {
        const now = new Date();
        const then = new Date(item.createdAt);
        return (
          then.getFullYear() < now.getFullYear() ||
          (then.getFullYear() === now.getFullYear() &&
            then.getMonth() < now.getMonth())
        );
      })
      // sort by date
      .sort((a, b) => b.createdAt - a.createdAt);

    return { props: { history } };
  } catch (error) {
    console.log(error);
    return { props: { history: [] } };
  }
};
