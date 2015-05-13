var sqlite3 = require('sqlite3').verbose();
var async = require('async');
var mysql = require('mysql');
var fs = require('fs');
var _ = require('lodash');

var mysqlConnection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: ''
});

var jsonPath = 'output/cards.json';

fs.writeFileSync(jsonPath, '');

async.waterfall([
    getSQLiteConnection,
    getMySQLConnection,
    processData
], finalCallback);

function getSQLiteConnection(waterfallNext) {
    var db = new sqlite3.Database('cards.cdb');
    waterfallNext(null, db);
}

function getMySQLConnection(sqliteDb, waterfallNext) {
    mysqlConnection.connect(function(err) {
        waterfallNext(err, sqliteDb, mysqlConnection);
    });
}

function processData(sqliteConnection, mysqlConnection, waterfallNext) {
    var cards = [];
    sqliteConnection.serialize(function() {
        sqliteConnection.each("SELECT id, ot, alias, setcode, type, atk, def, level, race, attribute, category, name, desc FROM datas natural join texts", function(err, row) {
            if (err) {
                throw err;
            }
            cards.push(_.cloneDeep(row));

        }, callback);

        function callback(err, data) {
            waterfallNext(null, cards, sqliteConnection, mysqlConnection);
        }
    });
}

function finalCallback(error, cards, sqliteConnection, mysqlConnection) {
    fs.appendFileSync(jsonPath, JSON.stringify(cards, null, '    '));

    if (error) {
        console.error(error);
    }

    sqliteConnection.close();
    mysqlConnection.destroy();
}
