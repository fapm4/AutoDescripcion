const mysql = require('promise-mysql');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'autodescripcion'
});

function getConn(){
    return conn;
}

module.exports = { getConn };