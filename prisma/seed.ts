import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Element, type WeaponType } from "../src/generated/prisma/client";
import characters from "../data/characters.json";

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
  console.log(`Seeded ${characters.length} characters.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
