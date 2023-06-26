import { sanitizeUrl } from "@braintree/sanitize-url";
import { type RecentQueriesProps } from "@/pages";
import { useRouter } from "next/router";

const RecentQueries = (props: RecentQueriesProps) => {
  const router = useRouter();

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const url = event.target.value;
    router.push("/?comp=" + url);
  };

  const stats = props.data;

  const listStats = stats?.map((stat) => {
    if (!stat.compTitle) return;
    return (
      <option key={stat.id} value={sanitizeUrl(stat.compUrl)}>
        {stat.compTitle}
      </option>
    );
  });

  return (
    <select className="select w-full" onChange={handleSelect}>
      <option disabled defaultValue={0}>
        Recent queries
      </option>
      {listStats}
    </select>
  );
};

export default RecentQueries;
