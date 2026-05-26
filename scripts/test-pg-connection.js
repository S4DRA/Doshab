require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No DATABASE_URL in environment');
  process.exit(2);
}

const client = new Client({ connectionString });

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
