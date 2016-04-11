var express = require('express');
var app = express();
var jsonfile = require('jsonfile');
var util = require('util');

var file = './config/hdp.json.example';
var hdpJson = '';
jsonfile.readFile(file, function(err, obj) {
    if (err) throw err;
    hdpJson = obj;
    
    app.get('/start', function (req, res) {
        res.send(hdpJson);
    });

    app.get('/invoke', function (req, res) {
        // invoke a function with params
        res.send('invoke');
    });

    app.get('*', function(req, res) {
        res.redirect('/start');
    });
});
 
app.listen(3000, '127.0.0.1');