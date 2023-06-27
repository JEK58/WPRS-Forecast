import { sanitizeUrl } from "@braintree/sanitize-url";
import { type RecentQueriesProps } from "@/pages";
import { useRouter } from "next/router";

const RecentQueries = (props: RecentQueriesProps) => {
  const router = useRouter();

  const handleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const url = event.target.value;
    await router.push("/?comp=" + url);
  };

  const recentQueries = props.data;
  const uniqueQueries = recentQueries.filter(
    (item, index, self) =>
      index === self.findIndex((i) => i.compTitle === item.compTitle)
  );

  const listRecentQueries = uniqueQueries?.map((stat) => {
    if (!stat.compTitle) return;
    return (
      <option key={stat.id} value={sanitizeUrl(stat.compUrl)}>
        {stat.compTitle}
      </option>
    );
  });

  return (
    <select
      className="select my-3 h-12 w-full  items-center space-x-3 rounded-lg border border-gray-300 bg-white px-4 text-left text-slate-600 shadow-sm  ring-1 ring-slate-900/10 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-[hsl(125,50%,56%)]"
      onChange={handleSelect}
      defaultValue="DEFAULT"
    >
      <option disabled value="DEFAULT">
        Recent queries
      </option>
      {listRecentQueries}
    </select>
  );
};

export default RecentQueries;
