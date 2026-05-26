/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL in environment');
  process.exit(2);
}

const url = new URL(connectionString);

if (!url.searchParams.has('sslmode')) {
  url.searchParams.set('sslmode', 'no-verify');
}

const client = new Client({
  connectionString: url.toString(),
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 20000),
});

client
  .connect()
  .then(() => {
    console.log('Connected to Postgres successfully');
  })
  .catch((err) => {
    console.error('Connection error:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  })
  .finally(() => client.end());
