import { getCivlcompsComp } from "@/utils/get-civl-comp";
import { getCivlId } from "@/utils/get-civl-id";
import fetch from "node-fetch";
import * as querystring from "querystring";
import axios from "axios";

// it("should reject a comp that lies in the past", async () => {
//   const startTime = performance.now();
//   console.log("⏱️ ~ ", "Timer started");

//   const url = "https://civlcomps.org/event/german-open-2023/participants";

//   const detailsUrl = "https://civlcomps.org/event/german-open-2023";
//   const res = await getCivlcompsComp(url, detailsUrl);
//   console.log("🚀 ~ res:", res.maxPilots);

//   const endTime = performance.now();
//   const elapsedTime = endTime - startTime;
//   console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");

//   expect(true).toBe(true);
// }, 10000);

import { CookieJar } from "tough-cookie";
it("should reject a comp that lies in the past", async () => {
  const startTime = performance.now();
  console.log("⏱️ ~ ", "Timer started");

  // Create a new cookie jar
  const cookieJar = new CookieJar();

  // const cookies = await cookiejar.getCookies(
  //   "https://civlcomps.org/ranking/paragliding-xc/pilots",
  // );
  // console.log("🚀 ~ cookies:", cookies);

  const loginResponse = await fetch(
    "https://civlcomps.org/ranking/paragliding-xc/pilots",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  const cookies = loginResponse.headers.getSetCookie();

  cookies.forEach((cookieStr) => {
    cookieJar.setCookieSync(cookieStr, "https://civlcomps.org"); // Store the cookie
  });

  console.log(
    "🚀 ~ Cookies:",
    cookieJar.getCookieStringSync("https://civlcomps.org"),
  );
  const csrf = cookieJar
    .getCookiesSync("https://civlcomps.org")
    .find((cookie) => cookie.key === "_csrf")?.value;
  console.log("🚀 ~ csrfCookie:", csrf);
  // getCookieStringSync("https://civlcomps.org");
  const url = "https://civlcomps.org/meta/search-profile";
  console.log(cookieJar.getCookieStringSync("https://civlcomps.org"));

  const _csrf =
    "tx7yv3k4ipQyrsGGFNguG6GuPIkUDuokz0FigV0whQ7BV4jnPlnExGX28fFRvFZIkuAK2mE2pUGGLCzrEQbIRw%3D%3D";

  const _cookie =
    "PHPSESSID=a80eb01c17ae0f3b83800f69b26e8713; _csrf=56de10d185a3d5a84f469cf44bd1df1966471a942df3230657a11c5b0b406965a%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22o-y3xcbdZpXL4I8AtknfrQVajdRXAI7c%22%3B%7D";
  const cookie =
    "PHPSESSID=17dab77915163c863ca38c1700b0e38f; _csrf=79b95e8bf43ff6d0c835b82294e30dd10a433bb6ff5030e3a7d01233f718fc6ba%3A2%3A%7Bi%3A0%3Bs%3A5%3A%22_csrf%22%3Bi%3A1%3Bs%3A32%3A%22vIzXGaNPWX0wEdxS3N6Su8OeImNjL6MI%22%3B%7D";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Cookie: cookie,

    Pragma: "no-cache",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Sec-Fetch-Site": "same-origin",
  };

  const formData =
    "term=stephan+sch%C3%B6pe&meta=true&_csrf=G4wPThn5GpR6O6TEiP4zTn-ixpKJ5WMaW1bhG3g2lWRtxXUWXphUxC1jlLPNmksdTOzwwfzdLH8SO69xNADYLQ%3D%3D";

  const res = await axios.post(url, formData, { headers });

  async function makeGetRequest() {
    try {
      const baseUrl = "https://civlcomps.org/meta/search-profile";
      const queryParams = { term: "stephan schöpe" };
      const queryString = querystring.stringify(queryParams);
      const finalUrl = `${baseUrl}?${queryString}`;

      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
      };

      const response = await fetch(finalUrl, {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const data = await response.text();
        // Handle the response data here
        console.log(data);
      } else {
        throw new Error("Fetch request failed.");
      }
    } catch (error) {
      // Handle errors here
      console.error("Fetch error:", error);
    }
  }

  // Call the function to make the GET request
  await makeGetRequest();

  const id = res.data[0].id;
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;
  console.log("⏱️ ~ ", (elapsedTime / 1000).toFixed(2), "seconds");
  expect(id).toBe(39705);
}, 10000);
