const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Tiago-silva29',
    database: 'todo_list'
});

module.exports = pool.promise();