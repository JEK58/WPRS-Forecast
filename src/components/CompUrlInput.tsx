import Link from "next/link";
import Box from "@/components/ui/Box";
import { CompUrlInputField } from "./CompUrlInputField";

export function CompUrlInput() {
  return (
    <Box>
      <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
        Link to Comp
      </h2>

      <CompUrlInputField />

      <div className="mt-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        <ul className="list-outside list-disc space-y-1 px-4 text-sm text-slate-600 dark:text-slate-300">
          <li>This only works for XC paragliding competitions.</li>
          <li>
            Make sure to paste the correct link from the platform that actually
            hosts the comp - even if civlcomps.org lists them all.
          </li>
          <li>
            The calculation will become{" "}
            <span className="font-semibold">more accurate</span> as the
            competition date approaches.
          </li>

          <li> It will not work for past events. It&apos;s a forecast!</li>
        </ul>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          See the{" "}
          <Link
            className="font-semibold text-green-600 underline decoration-green-500 decoration-dotted underline-offset-3 hover:decoration-solid dark:text-green-400"
            href="/history"
          >
            history page
          </Link>{" "}
          for forecast accuracy statistics.
        </p>
      </div>
    </Box>
  );
}
