const mysql = require("mysql2");
require("dotenv").config({ quiet: true });

const requiredSettings = ["DB_HOST", "DB_USER", "DB_NAME"];
const databaseConfigured = requiredSettings.every((setting) => process.env[setting]);
const databaseEnabled = process.env.DB_ENABLED !== "false" && databaseConfigured;

if (!databaseEnabled) {
  module.exports = null;
} else {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 5000,
  });

  module.exports = pool.promise();
}
