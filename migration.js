var settings = require('./settings');
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
    connectionLimit : 10,
    host     : settings.db.host,
    user     : settings.db.username,
    password : settings.db.password,
    database : settings.db.name,
    port     : settings.db.port
});

migration.init(connection, __dirname + '/migrations');