import { Spinner } from "@/components/Spinner";
import Head from "next/head";
import { useEffect, useState, type ChangeEvent, useCallback } from "react";
import { Footer } from "@/components/Footer";
import { isValidUrl } from "@/utils/check-valid-url";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import RecentQueries from "@/components/RecentQueries";
import { prisma } from "@/server/db";
import { type InferGetServerSidePropsType } from "next";
import { ForecastView } from "@/components/ForecastView";
import { ClearButton } from "@/components/ClearButton";

export type RecentQueriesProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>;

const Home = (props: RecentQueriesProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [isValidLink, setIsValidLink] = useState(false);
  const utils = api.useContext();

  const router = useRouter();

  const { data, error, isFetching } = api.wprs.getWprs.useQuery(
    { url },
    {
      enabled: isLoading,
      cacheTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      onSuccess: () => setIsLoading(false),
    }
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      if (!isValidLink) return;
      event.preventDefault();
      await utils.wprs.invalidate();
      setIsLoading(true);
      await router.replace("/");
    } catch (error) {
      console.log(error);
    }
  };

  // Validate link on input change
  useEffect(() => {
    if (isValidUrl(url)) setIsValidLink(true);
    else setIsValidLink(false);
  }, [url]);

  // Get comp from url
  useEffect(() => {
    const params = new URLSearchParams(router.asPath.split(/\?/)[1]);
    const comp = params.get("comp");

    if (comp) setUrl(comp);
  }, [router.asPath]);

  function onUrlChange(event: ChangeEvent<HTMLInputElement>) {
    setUrl(event.target.value);
  }

  async function clearInput() {
    try {
      setIsLoading(false);
      setUrl("");
      await router.replace("/");
      await utils.wprs.invalidate();
    } catch (error) {
      console.log(error);
    }
  }

  const resetCompData = () => setUrl("");

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

      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-grow flex-col items-center gap-8 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            WPRS <span className="text-primary">Forecast</span>{" "}
            <span className="block text-right text-sm tracking-normal sm:inline sm:text-left">
              beta
            </span>
          </h1>
          {!data && (
            <div>
              <form
                className="mt-5 w-full max-w-3xl justify-center gap-3 md:flex"
                onSubmit={handleSubmit}
              >
                <div className="mb-3 w-full md:mb-0 ">
                  <div className="relative">
                    {/* URL input */}
                    <input
                      autoFocus
                      ref={inputUrl}
                      type="text"
                      value={url}
                      className="input h-12 w-full items-center space-x-3 rounded-lg border border-gray-300 bg-white px-4 text-left text-slate-600 shadow-sm ring-1 ring-slate-900/10 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      onChange={onUrlChange}
                      placeholder="Link to comp (CIVL, PWC, Airtribune or Swissleague)"
                    />
                    {/* Clear button */}
                    {url.length > 0 && !isFetching && (
                      <div onClick={clearInput}>
                        <ClearButton />
                      </div>
                    )}
                  </div>
                  {/* Select queries */}
                  {props.data.length > 0 && <RecentQueries {...props} />}
                </div>
                {/* Calculate button */}
                <div className="w-full sm:w-auto md:w-40">
                  <button
                    type="submit"
                    disabled={!isValidLink}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 enabled:hover:bg-indigo-700 md:h-full"
                  >
                    {isFetching && <Spinner />}{" "}
                    {isFetching ? "Calculating…" : "Calculate"}
                  </button>
                </div>
              </form>
              <div className="mt-4 text-red-500">
                {!isValidLink && url.length > 0 && (
                  <p>This is not a valid link</p>
                )}
                {error?.message && <p>{error?.message}</p>}
              </div>

              <div className="mt-2 text-white md:max-w-3xl ">
                <span className="text-primary">Note: </span>This only works for
                paragliding competitions. Make sure to paste the correct link
                from the platform that actually hosts the comp - even if
                civlcomps.org lists them all.
              </div>
            </div>
          )}
          {/* Forecast view */}
          {data && <ForecastView data={data} onResetCompData={resetCompData} />}
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
      select: { wprs: true, compUrl: true, id: true, compTitle: true },
      take: 30,
    });
    return { props: { data } };
  } catch (error) {
    console.log(error);
    return { props: { data: [] } };
  }
};

export default Home;
