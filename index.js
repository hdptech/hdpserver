var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var queryString = require('query-string');


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
                
        var parameters = [];
                
        if (requestedFunction !== undefined) {    
            if ('inputParameters' in functionStuff) {
                for (var j = 0; j < functionStuff.inputParameters.length; j++) {
                    if ('required' in functionStuff.inputParameters[j]) {
                        var name = functionStuff.inputParameters[j]['name'];
                        var obj = {};
                        obj[name] = req.body[name];
                        parameters.push(obj);
                    }
                }
            } else {
                console.log('no inout params');
            }
            
            console.log(parameters);
            var query = queryString.stringify(parameters[0]);
            
            console.log('url');
            console.log(functionStuff.upstream + '?' + query);
            
            request.get({url:functionStuff.upstream + '?' + query},
            function(err,httpResponse,body){
                console.log(err);
                console.log(body);
            })
            
        } else {
            console.log('No function available');
        }
        
        res.send('finish');
    });
    
    app.get('*', function(req, res) {
        res.redirect('/start');
    });
    
    app.listen(3000, '127.0.0.1');
    
    callback(null, '');
}
