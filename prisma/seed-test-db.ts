import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

async function main() {
  const test = await prisma.ranking.findFirst();
  if (test) throw new Error("DB already contains data!");

  const pilots = generatePilots(200);
  const res = await prisma.ranking.createMany({ data: pilots });
  console.log(res);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

function generatePilots(numberOfPilots: number) {
  const pilots = [];
  for (let i = 1; i <= numberOfPilots; i++) {
    pilots.push({
      id: i,
      name: `Pilot ${i}`,
      gender: Math.random() < 0.5 ? "F" : "M",
      points: numberOfPilots - i + 1,
      rank: i,
      nation: "world",
      date: new Date(),
    });
  }
  return pilots;
}
