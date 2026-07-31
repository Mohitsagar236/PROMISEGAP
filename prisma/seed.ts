import { seedDemoData } from "./seed-helpers";

const reset = process.argv.includes("--reset");

seedDemoData(reset)
  .then((result) => {
    console.log(`Seeded ${result?.accounts.length ?? 0} accounts and ${result?.promises.length ?? 0} promises.`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
