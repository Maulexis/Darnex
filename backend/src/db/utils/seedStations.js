// src/db/utils/seedStations.js
import { query } from "../../services/db.js";
import { faker } from "@faker-js/faker";

async function seedStations(count = 5) {
  console.log(`🚉 Seeding ${count} stations...`);

  const stations = [];
  for (let i = 0; i < count; i++) {
    const name = faker.location.city() + " Station";
    const code = faker.string.alpha({ count: 3 }).toUpperCase(); // random 3-letter code
    const latitude = faker.location.latitude();
    const longitude = faker.location.longitude();

    stations.push([name, code, latitude, longitude]);
  }

  for (const [name, code, latitude, longitude] of stations) {
    await query(
      `
      INSERT INTO stations (name, code, latitude, longitude)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude
      `,
      [name, code, latitude, longitude]
    );

    console.log(`✅ Station ${code} (${name}) added/updated.`);
  }

  console.log(`🎉 Stations seeding complete!`);
}

// Run directly with custom count
if (process.argv[1].includes("seedStations.js")) {
  const count = parseInt(process.argv[2]) || 5;
  seedStations(count).then(() => process.exit(0));
}

export default seedStations;
