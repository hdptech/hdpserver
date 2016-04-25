var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var queryString = require('query-string');

var sprintf = require("sprintf-js").sprintf;

var log4js = require('log4js'); 
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('app.log'), 'main');
var logger = log4js.getLogger('main');
logger.setLevel('TRACE');

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
    logger.trace('Application has been succesfully started');
});

function getHdpJson(callback) {
    jsonfile.readFile(file, function(err, obj) {
        if (err) return callback(err, null);
        callback(null, obj);
    });
}
function registerUrlHandlers(hdpJson, callback) {
    app.get('/start', function (req, res) {
        var resultJson = hdpJson;
        for (var i = 0; i < resultJson.functions.length; i++) {
            delete resultJson.functions[i]['upstream'];
        }
        res.send(resultJson);
    });

    app.post('/invoke', urlencodedParser, function (req, res) {
        var requestedFunction = req.body.function;
        logger.trace('Function "' + requestedFunction + '" has been requested');
        var functionStuff;
        var functionFound = 0;
        
        for (var i = 0; i < hdpJson['functions'].length; i++) {
            if (requestedFunction === hdpJson['functions'][i]['name']) {
                functionStuff = hdpJson['functions'][i];
                functionFound = 1;
                break;
            }
        }
        
        if (functionFound === 0) {
            logger.trace('Requested function not found in the upstream service config');
            res.end(getErrorResponse('Function not found'));
            return;
        }
        
        var parameters = [];
        if ('inputParameters' in functionStuff) {
            for (var j = 0; j < functionStuff.inputParameters.length; j++) {
                var name = functionStuff.inputParameters[j]['name'];
                var obj = {};
                obj[name] = req.body[name];
                
                if ('required' in functionStuff.inputParameters[j] && typeof obj[name] === 'undefined') {
                    logger.trace('Required parameter "' + name +  '" not passed');
                    res.end(getErrorResponse('Parameter "' + name + '" is required'));
                    return;
                }
                
                parameters.push(obj);
            }
        }
        
        var querySuffix;
        
        if (Object.keys(parameters).length === 0) {
            querySuffix = '';
        } else {
            querySuffix = '?';
            for (var k = 0; k < parameters.length; k++) {
                querySuffix += queryString.stringify(parameters[k]);
            }
        }
        logger.trace('querySuffix: ' + querySuffix);

        request.get({url:functionStuff.upstream + querySuffix},
            function(err, httpResponse, body) {
                if (err) {
                    logger.error(err);
                    res.end(getErrorResponse('Service unavailable'));
                    return;
                } else {
                    logger.trace('httpResponse.statusCode: ' + httpResponse.statusCode);
                    logger.trace('body:');
                    logger.trace(body);
                    res.end(getSuccessResponse(body));
                    return;
                }
        });
    });
    
    app.get('*', function(req, res) {
        res.redirect('/start');
    });
    
    app.listen(3000, '127.0.0.1');
    
    callback(null, '');
}

function getSuccessResponse(message) {
    return JSON.stringify({"output" : message});
}

function getErrorResponse(error) {
    return JSON.stringify({"error" : error});
}