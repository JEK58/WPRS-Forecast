import axios from "axios";

const CIVL_PLACEHOLDER_ID = 99999;

interface CivlPilotLookup {
  id: number;
  text: string;
}
export async function lookupCivlId(name: string) {
  const searchString = name.replaceAll(" ", "+");
  const headersList = {
    Accept: "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const reqOptions = {
    url: "https://civlcomps.org/meta/search-profile/",
    method: "GET",
    headers: headersList,
    data: `term=${searchString}`,
  };

  try {
    const res = await axios.request<CivlPilotLookup[]>(reqOptions);
    if (!res.data || !res.data.length) {
      console.log(`❗️ ~ No data for ${name}`);
      return CIVL_PLACEHOLDER_ID;
    }

    const data = res.data;

    const splitNameParts = normalizeName(name).split(" ");

    if (data.length > 1) {
      const filtered = data.filter(
        (el) =>
          normalizeName(el.text).includes(splitNameParts[0] ?? "") &&
          normalizeName(el.text).includes(" " + (splitNameParts.at(-1) ?? ""))
      );
      if (!filtered[0]) {
        console.log(`❗️ ~ No data for ${name}`);
        return CIVL_PLACEHOLDER_ID;
      }
      console.log(
        `❗️ ~ Multiple results for ${name}. Picked: ${filtered[0].text}`
      );
      return filtered[0].id;
    }
    if (data[0]) return data[0].id;
    else return CIVL_PLACEHOLDER_ID;
  } catch (error) {
    console.log(error);
    return CIVL_PLACEHOLDER_ID;
  }
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
