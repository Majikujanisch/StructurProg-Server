const mysql = require('mysql2')
require('dotenv').config()
const db = mysql.createConnection({
host: process.env.HOST_DB,
user: process.env.USER_DB,
password: process.env.PASSWORT_DB,
database: process.env.DATABASE_DB 
})

module.exports = db;