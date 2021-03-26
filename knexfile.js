import { config } from "dotenv";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

config();

export default {
  client: "pg",
  connection: `${process.env.DATABASE_URL}?ssl=true`,
  migrations: {
    directory: `./db/migrations`,
  },
  seeds: {
    directory: "./db/seeds",
  },
};
