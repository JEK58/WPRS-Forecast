import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Box from "@/components/ui/Box";
import RecentQueriesTable from "@/components/RecentQueriesTable";
import { Spinner } from "@/components/Spinner";
import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import { isValidUrl } from "@/utils/check-valid-url";
import { api } from "@/utils/api";
import { prisma } from "@/server/db";
import { type InferGetServerSidePropsType } from "next";
import { ForecastView } from "@/components/ForecastView";
import { useRouter } from "next/router";
import { Footer } from "@/components/Footer";
import { Element, scroller, animateScroll } from "react-scroll";

export type RecentQueriesProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>;

export default function Home(props: RecentQueriesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [clipboardApiSupported, setClipboardApiSupported] = useState(false);

  const utils = api.useUtils();
  const router = useRouter();

  let isValidLink = isValidUrl(url);

  const { data, error, isFetching } = api.wprs.getWprs.useQuery(
    { url },
    {
      enabled: isLoading,
      cacheTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: () => setIsLoading(false),
      onError: () => setIsLoading(false),
      retry: (_, error) => !(error.data?.code == "BAD_REQUEST"),
    },
  );

  // Handles the update button click in the recent queries table
  const handleUpdate = async (url: string) => {
    setUrl(url);
    isValidLink = isValidUrl(url);
    await handleSubmit();
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    await utils.wprs.invalidate().catch((error) => console.log(error));
  };

  useEffect(() => {
    if (isValidLink) setIsLoading(true);
  }, [isValidLink]);

  // Used to scroll to the areas of interest
  useEffect(() => {
    if (data) {
      scroller.scrollTo("forecastViewScroll", {
        duration: 500,
        delay: 100,
        smooth: true,
        offset: -50,
      });
    } else {
      animateScroll.scrollToTop({
        duration: 500,
        smooth: true,
      });
    }
  }, [data]);

  // Only show the paste button when the browser supports reading from clipboard.
  // useEffect is needed to prevent a hydration error bc ".navigator" is only available in the browser
  useEffect(() => {
    setClipboardApiSupported(
      typeof navigator.clipboard !== "undefined" &&
        typeof navigator.clipboard.readText === "function",
    );
  }, []);

  const handlePaste = async () => {
    if (!clipboardApiSupported) return;
    await navigator.clipboard
      .readText()
      .then((text) => setUrl(text))
      .catch((error) => console.log(error));
  };

  async function clearInput() {
    setUrl("");
    setIsLoading(false);
    await utils.wprs.invalidate().catch((error) => console.log(error));
  }

  const resetCompData = async () => {
    await clearInput();

    // Refresh props for updated recent queries
    await router.replace(router.pathname);
  };

  // Get comp from url
  useEffect(() => {
    const params = new URLSearchParams(router.asPath.split(/\?/)[1]);
    const comp = params.get("comp");

    if (comp) setUrl(comp);
  }, [router.asPath]);

  // Autofocus input textbox
  const inputUrl = useCallback((inputElement: HTMLInputElement) => {
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  return (
    <>
      <Head>
        <title>WPRS Forecast</title>
        <meta
          name="description"
          content="Enables you to forecast the potential world ranking points for paragliding competitions."
        />
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
            {!data && (
              <Box>
                <h2 className="text-lg font-bold dark:text-slate-200">
                  Link to Comp
                </h2>
                <form
                  className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0"
                  onSubmit={handleSubmit}
                >
                  <div className="relative flex-grow">
                    <Input
                      autoFocus
                      ref={inputUrl}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="h-12 w-full rounded-md border-2 border-gray-300 p-2 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 "
                      placeholder="CIVL, PWC, Airtribune or Swissleague"
                    />
                    {/* Paste/Clear button */}
                    {url.length > 0 && !isFetching ? (
                      <button
                        onClick={clearInput}
                        className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded  px-2 py-1 font-bold text-gray-500 hover:text-green-500"
                      >
                        X
                      </button>
                    ) : (
                      // Only show the button when the browser supports reading from clipboard.
                      clipboardApiSupported && (
                        <Button
                          className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded bg-transparent px-2 py-1 font-bold text-gray-500 hover:text-gray-700"
                          onClick={handlePaste}
                        >
                          <svg
                            className=" h-4 w-4"
                            fill="none"
                            height="24"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              height="4"
                              rx="1"
                              ry="1"
                              width="8"
                              x="8"
                              y="2"
                            />
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          </svg>
                          <span className="sr-only">Paste from clipboard</span>
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    className="h-12 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 md:self-center"
                    type="submit"
                    disabled={!isValidLink}
                  >
                    {isFetching && <Spinner />}{" "}
                    {isFetching ? "Calculating…" : "Calculate"}
                  </Button>
                </form>
                {/* Error message */}
                <div className="text-sm text-red-500">
                  {!isValidLink && url.length > 0 && (
                    <p>This is not a valid link</p>
                  )}
                  {error?.message && <p>{error?.message}</p>}
                </div>
                {/* Notes */}
                <div className="border-t border-gray-200 py-2 dark:border-slate-600">
                  {/* <h3 className="text-lg font-semibold">Note:</h3> */}
                  <ul className="list-outside list-disc px-4 text-gray-500 dark:text-inherit">
                    <li>This only works for paragliding competitions.</li>
                    <li>
                      Make sure to paste the correct link from the platform that
                      actually hosts the comp - even if civlcomps.org lists them
                      all.
                    </li>
                    <li>
                      The calculation will become more accurate as the
                      competition date approaches.
                    </li>
                    <li>
                      PWC events may currently not give correct results or not
                      work at all. I have to adapt to the new events page.
                    </li>
                    <li>
                      {" "}
                      It will not work for past events. It&apos;s a forecast!
                    </li>
                  </ul>
                </div>
              </Box>
            )}
            {/* Forecast view */}
            {data && (
              <Box>
                <Element name="forecastViewScroll"></Element>
                <ForecastView data={data} onResetCompData={resetCompData} />
              </Box>
            )}
            {/* Recent queries */}
            {props.recentQueries.length > 0 && !data && (
              <Box>
                <RecentQueriesTable
                  recentQueries={props.recentQueries}
                  onUpdateButtonClick={handleUpdate}
                  disableUpdateButton={isLoading}
                />
              </Box>
            )}
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
        wprs: { not: null },
        NOT: [{ compTitle: null }, { compTitle: "" }],
      },
      select: {
        wprs: true,
        potentialWprs: true,
        compUrl: true,
        id: true,
        compTitle: true,
        createdAt: true,
      },
      take: 50,
    });

    const comps = data.map(({ createdAt, ...rest }) => {
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime(); // in milliseconds

      // Calculate time differences in hours and days
      const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));

      return {
        ...rest,
        ageInHours: hoursDiff,
      };
    });

    return { props: { recentQueries: comps } };
  } catch (error) {
    console.log(error);
    return { props: { recentQueries: [] } };
  }
};
