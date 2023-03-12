import { prisma } from "@/server/db";
import ranking from "../../ranking.json";

const pilots = ranking.map((el) => {
  return {
    id: parseInt(el["CIVL ID"], 10),
    name: "",
    gender: el.Gender,
    points: parseInt(el.Points, 10),
    rank: parseInt(el.Rank, 10),
    nation: el.Nation,
  };
});

async function importRanking() {
  await prisma.ranking.createMany({ data: pilots });
}

importRanking()
  .then((data) => {
    console.log("🚀 ~ createMany:", data);
  })
  .catch((err) => {
    console.log(err);

    // Deal with the fact the chain failed
  });
