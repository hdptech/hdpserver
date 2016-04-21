var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

var jsonfile = require('jsonfile');
var util = require('util');
var async = require('async');

var file = './config/hdp.json.example';

async.waterfall([
    getHdpJson,
    registerUrlHandlers
], function (err, result) {
    if (err) throw err;
    console.log(result);
});
function getHdpJson(callback) {
    jsonfile.readFile(file, function(err, obj) {
        if (err) return callback(err, null);
        callback(null, obj);
    });
}
function registerUrlHandlers(hdpJson, callback) {
    app.get('/start', function (req, res) {
        res.send(hdpJson);
    });

    app.post('/invoke', urlencodedParser, function (req, res) {
        var requestedFunction = req.body.function;
        var functionStuff;
        
        for (var i = 0; i < hdpJson['functions'].length; i++) {
            if (requestedFunction == hdpJson['functions'][i]['name']) {
                functionStuff = hdpJson['functions'][i];
                break;
            }
        }
        
        if (requestedFunction !== undefined) {            
            request.get({url:functionStuff.upstream, form: {"test" : 123}},
            function(err,httpResponse,body){
            })
            
        } else {
            console.log('No function available');
        }
        
        res.send('invoke');
    });
    
    app.get('*', function(req, res) {
        res.redirect('/start');
    });
    
    app.listen(3000, '127.0.0.1');
    
    callback(null, 'registered');
}
