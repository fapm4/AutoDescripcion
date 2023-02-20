const mysql = require('mysql');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'autodescripcion'
});

// Conecta con la bbdd y devuelve la conexion
function getConnection(){
    console.log('h1');
    conn.connect((err) => {
        if(err){
            console.log('h2');
            console.log('Error al conectar con la bbdd');
            throw err;
        }
        else{
            console.log('Conectado a la bbdd');
        }
    });
}

function pito(){
    console.log('pito');
}

module.exports = { getConnection, pito };