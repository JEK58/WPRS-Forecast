import { type InferGetServerSidePropsType } from "next";
import { prisma } from "@/server/db";
import { sanitizeUrl } from "@braintree/sanitize-url";

import Head from "next/head";

const Stats = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const stats = props.data;

  const listStats = stats?.map((stat) => {
    if (!stat.compTitle) return;
    return (
      <tr key={stat.id}>
        <td className="text-right">{stat.wprs} -</td>
        <td>
          <a
            className="text-[hsl(125,50%,56%)] hover:underline hover:decoration-dotted"
            href={sanitizeUrl(stat.compUrl)}
          >
            {stat.compTitle}
          </a>
        </td>
      </tr>
    );
  });

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
            <tbody>{listStats}</tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps = async () => {
  // await new Promise((resolve) => setTimeout(resolve, 2000));
  try {
    const data = await prisma.usage.findMany({
      orderBy: { createdAt: "desc" },
      select: { wprs: true, compUrl: true, id: true, compTitle: true },
    });
    return {
      props: {
        data,
      },
    };
  } catch (error) {
    console.log(error);
  }
};
export default Stats;
