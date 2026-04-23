// db/pool.js
// PostgreSQL connection pool (like JDBC DataSource)

const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "mentoros",
});

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

module.exports = pool;
