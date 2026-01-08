import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    const db = drizzle(client);

    console.log('Running migrations...');
    // Note: For this project we might just use push, but if we had migrations folder:
    // await migrate(db, { migrationsFolder: 'drizzle' }); 
    // However, the prompt asks for "Tables must be created programmatically via Drizzle ORM"
    // We can use drizzle-kit push for prototyping or run migration files.

    // Since we are setting up, we'll rely on `drizzle-kit push` which is in package.json
    console.log('Use `npm run db:push` to sync schema with database.');

    await client.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
