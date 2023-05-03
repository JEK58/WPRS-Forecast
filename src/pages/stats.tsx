import { type NextPage } from "next";
import Head from "next/head";

import { api } from "@/utils/api";

const Stats: NextPage = () => {
  const stats = api.wprs.getStats.useQuery();

  const listStats = stats.data ? (
    stats.data?.map((stat) => (
      <tr key={stat.id}>
        <td>{stat.wprs}</td>
        <td>{stat.compUrl}</td>
      </tr>
    ))
  ) : (
    <tr>
      <td></td>
      <td></td>
    </tr>
  );

  return (
    <>
      <Head>
        <title>WPRS Stats</title>
        {/* <meta name="description" content="" /> */}
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Stats
          </h1>

          <table className="table-auto text-white">
            <thead>
              <tr>
                <td>WPRS</td>
                <td>Comp</td>
              </tr>
            </thead>
            <tbody>{listStats}</tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default Stats;
