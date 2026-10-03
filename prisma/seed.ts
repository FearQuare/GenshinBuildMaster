import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Element, type WeaponType } from "../src/generated/prisma/client";
import characters from "../data/characters.json";
import { LOCAL_USER_ID } from "../src/lib/current-user";

type CharacterSeed = {
  id: string;
  name: string;
  element: Element;
  weaponType: WeaponType;
  rarity: number;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  for (const { id, ...data } of characters as CharacterSeed[]) {
    await prisma.character.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  await prisma.user.upsert({
    where: { id: LOCAL_USER_ID },
    create: { id: LOCAL_USER_ID, name: "Traveler" },
    update: {},
  });
  console.log(`Seeded ${characters.length} characters.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
