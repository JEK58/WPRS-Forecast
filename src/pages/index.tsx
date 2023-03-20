import { ForecastDetails } from "@/components/ForecastDetails";
import { Spinner } from "@/components/Spinner";
import { type CompForecast } from "@/utils/calculate-wprs";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { Footer } from "@/components/Footer";

// const url = "https://airtribune.com/montegrappa-trophy-2023";
// const url =
//   "https://civlcomps.org/event/staufen-cup-2023-bawu-open-und-vorarlberger-landesmeistersch/";
// const url = "https://airtribune.com/flory-cup-2023/pilots"

const Home: NextPage = () => {
  const [compForecast, setCompForecast] = useState<CompForecast | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [url, setUrl] = useState<string>("");
  const [isValidLink, setIsValidLink] = useState(false);

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(undefined);
    setCompForecast(undefined);
    const endpoint = "/api/comp-forecast";
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    };

    try {
      const response = await fetch(endpoint, options);

      if (response.status === 201) {
        const resData = (await response.json()) as CompForecast;

        setCompForecast(resData);
      } else if (response.status === 429) setError("Too many requests");
      else if (response.status === 400) setError("This is not a valid link");
      else if (response.status === 204)
        setError("No confirmed pilots in this comp");
      else throw new Error("Ooops… something went wrong.");
    } catch (error) {
      setError("Ooops… something went wrong.");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      url.includes("airtribune.com") ||
      url.includes("civlcomps.org") ||
      url.includes("pwca.org")
    )
      setIsValidLink(true);
    else setIsValidLink(false);
  }, [url]);

  function onUrlChange(event: ChangeEvent<HTMLInputElement>) {
    setUrl(event.target.value);
  }

  return (
    <>
      <Head>
        <title>WPRS Forecast</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col items-center  bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-grow flex-col items-center gap-8 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            WPRS <span className="text-[hsl(125,50%,56%)]">Forecast</span>
          </h1>
          <div className="mt-5 w-full justify-center gap-3 sm:flex">
            <div className="md:w-100 mb-3 w-full sm:mb-0  md:max-w-xl">
              <input
                type="text"
                className="h-12 w-full items-center space-x-3 rounded-lg border border-gray-300 bg-white px-4 text-left text-slate-600 shadow-sm  ring-1 ring-slate-900/10 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[hsl(125,50%,56%)]"
                onChange={onUrlChange}
                placeholder="Link to comp (CIVL, PWC, or Airtribune)"
              />
            </div>
            <div className="w-full sm:w-auto md:w-40">
              <button
                disabled={!isValidLink}
                onClick={handleSubmit}
                className="flex h-12 w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm focus:outline-none focus:ring-2  focus:ring-indigo-500 focus:ring-offset-2 enabled:hover:bg-indigo-700"
              >
                {isLoading && <Spinner />}{" "}
                {isLoading ? "Calculating…" : "Calculate"}
              </button>
            </div>
          </div>
          <div className="text-red-500">
            <p>{error}</p>
          </div>

          {compForecast && (
            <div className="flex max-w-lg flex-col gap-4 rounded-xl bg-white/10 p-4 text-white ">
              <div className="text-lg">
                WPRS:{" "}
                <span className="font-bold text-[hsl(125,50%,56%)]">
                  {compForecast?.WPR}
                </span>
              </div>
              <div className="text-sm text-slate-100">
                <ForecastDetails data={compForecast} />
              </div>

              <Link
                className="text-sm text-[hsl(125,50%,56%)] hover:underline hover:decoration-dotted"
                target="_blank"
                href="https://www.fai.org/sites/default/files/civl/documents/sporting_code_s7_e_-_wprs_2022.pdf"
              >
                Details can be found in the FAI Sporting Code Section 7E
              </Link>
              <p className="text-sm">
                This forecast is based on the currently confirmed pilots and
                their CIVL rankings. The calculation will become more accurate
                as the competition date approaches.
              </p>
              <p className="text-sm text-slate-200">
                Limitations: For technical reasons (lookup by name), the
                calculation of a comp listed on civlcomps.org and pwca.org is
                currently less accurate than on airtribune.com (And takes
                significantly longer). I&apos;m working on it 😜
              </p>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
};

export default Home;
