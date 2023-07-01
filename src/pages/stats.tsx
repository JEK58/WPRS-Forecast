import { type InferGetServerSidePropsType } from "next";
import { prisma } from "@/server/db";
import { sanitizeUrl } from "@braintree/sanitize-url";
import Head from "next/head";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { BiArrowBack } from "react-icons/bi";

const Stats = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const stats = props.data;

  const listStats = stats?.map((stat) => {
    if (!stat.compTitle) return;
    return (
      <tr key={stat.id}>
        <td className="pr-2 text-right align-top text-slate-400">
          {stat.createdAt}
        </td>

        <td className="text-right align-top">{stat.wprs}</td>
        <td className="align-top">-</td>
        <td className="max-w-md whitespace-pre-line">
          <a
            className="text-primary hover:underline hover:decoration-dotted"
            href={sanitizeUrl(stat.compUrl)}
            target="_blank"
            rel="noopener noreferrer"
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
        <title>WPRS Statistics</title>
        {/* <meta name="description" content="" /> */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-grow flex-col items-center gap-8 px-4 py-16 ">
          <h1 className="text-3xl tracking-tight text-white ">
            Recent Queries
          </h1>

          <table className="table-auto text-white">
            <tbody>{listStats}</tbody>
          </table>
          <Link
            href="/"
            className="flex items-center  text-white hover:underline"
          >
            <BiArrowBack />
            Back
          </Link>
        </div>
        <Footer />
      </main>
    </>
  );
};

export const getServerSideProps = async () => {
  try {
    const data = await prisma.usage.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        wprs: { not: null },
        compTitle: { not: null },
      },
      select: {
        wprs: true,
        compUrl: true,
        id: true,
        compTitle: true,
        createdAt: true,
      },
      take: 150,
    });

    const modifiedCreatedAt = data.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toLocaleDateString("de-DE", {
        // year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }),
    }));

    return {
      props: { data: modifiedCreatedAt },
    };
  } catch (error) {
    console.log(error);
    return { props: { data: [] } };
  }
};
export default Stats;
