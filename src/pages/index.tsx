import { ForecastDetails } from "@/components/ForecastDetails";
import { Spinner } from "@/components/Spinner";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { Footer } from "@/components/Footer";
import { isValidUrl } from "@/utils/check-valid-url";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { ListRankings } from "@/components/ListRankings";

const Home: NextPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [isValidLink, setIsValidLink] = useState(false);
  const utils = api.useContext();

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
    if (!isValidLink) return;
    event.preventDefault();
    await utils.wprs.invalidate();
    setIsLoading(true);
    await router.replace("/");
  };

  // Validate link on input change
  useEffect(() => {
    if (isValidUrl(url)) setIsValidLink(true);
    else setIsValidLink(false);
  }, [url]);

  const router = useRouter();

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
    setIsLoading(false);
    setUrl("");
    await router.replace("/");
    await utils.wprs.invalidate();
  }

  const resetCompData = () => setUrl("");

  return (
    <>
      <Head>
        <title>WPRS Forecast</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-grow flex-col items-center gap-8 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            WPRS <span className="text-[hsl(125,50%,56%)]">Forecast</span>{" "}
            <span className="block text-right text-sm tracking-normal sm:inline sm:text-left">
              beta
            </span>
          </h1>
          {!data && (
            <>
              <form
                className="mt-5 w-full justify-center gap-3 sm:flex"
                onSubmit={handleSubmit}
              >
                <div className="md:w-100 mb-3 w-full sm:mb-0  md:max-w-xl">
                  <div className="relative">
                    <input
                      type="text"
                      value={url}
                      className="h-12 w-full items-center space-x-3 rounded-lg border border-gray-300 bg-white px-4 text-left text-slate-600 shadow-sm  ring-1 ring-slate-900/10 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[hsl(125,50%,56%)]"
                      onChange={onUrlChange}
                      placeholder="Link to comp (CIVL, PWC, Airtribune or Swissleague)"
                    />
                    {url.length > 0 && !isFetching && (
                      <button
                        className="absolute right-0 top-0 mr-2 mt-3 rounded-full bg-indigo-600 px-2 py-1 text-white hover:bg-gray-400 hover:bg-indigo-700 focus:bg-gray-400 focus:outline-none"
                        type="button"
                        onClick={clearInput}
                      >
                        <svg
                          className="h-4 w-4 fill-current"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6.4 6.4l7.2 7.2m0-7.2l-7.2 7.2"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full sm:w-auto md:w-40">
                  <button
                    type="submit"
                    disabled={!isValidLink}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm focus:outline-none focus:ring-2  focus:ring-indigo-500 focus:ring-offset-2 enabled:hover:bg-indigo-700"
                  >
                    {isFetching && <Spinner />}{" "}
                    {isFetching ? "Calculating…" : "Calculate"}
                  </button>
                </div>
              </form>
              <div className="text-red-500">
                {!isValidLink && url.length > 0 && (
                  <p>This is not a valid link</p>
                )}
                <p>{error?.message}</p>
              </div>
            </>
          )}

          {data && (
            <div className="flex max-w-lg flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
              <div className="justify-content-between flex items-start ">
                <div className="flex-grow">
                  <h2 className="text-lg font-bold text-white sm:text-2xl">
                    {data.confirmed?.compTitle}
                  </h2>
                </div>

                <button
                  className="rounded-full px-0.5 py-0.5 text-white hover:bg-[hsl(125,50%,56%)] focus:bg-gray-400 focus:outline-none"
                  type="button"
                  onClick={resetCompData}
                >
                  <svg
                    className="h-6 w-6 fill-current"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.4 6.4l7.2 7.2m0-7.2l-7.2 7.2"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="text-lg">
                WPRS:{" "}
                <span className="font-bold text-[hsl(125,50%,56%)]">
                  {data?.confirmed?.WPRS[0]?.Ta3}
                </span>
              </div>
              <div className="text-sm text-slate-100">
                <ForecastDetails data={data} />
              </div>

              <Link
                className="text-sm text-[hsl(125,50%,56%)] hover:underline hover:decoration-dotted"
                target="_blank"
                href="https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf"
              >
                Details can be found in the FAI Sporting Code Section 7E
              </Link>
              <p className="text-sm">
                This forecast is based on the currently confirmed/registered
                pilots and their CIVL rankings. The calculation will become more
                accurate as the competition date approaches.
              </p>
              <ListRankings data={data} />
            </div>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
};

export default Home;
