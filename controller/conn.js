require("dotenv").config();

const mysql = require("mysql2");

const connection = mysql.createConnection(process.env.DB_URL);

module.exports = connection;
