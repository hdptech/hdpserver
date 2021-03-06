var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var queryString = require('query-string');
var Regex = require("regex");
var escapeStringRegexp = require('escape-string-regexp');
var uniqueRandomArray = require('unique-random-array');

var Cacheman = require('cacheman');
var inArray = require('in-array');
var cache = new Cacheman();

var log4js = require('log4js'); 
log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('app.log'), 'main');
var logger = log4js.getLogger('main');
logger.setLevel('TRACE');

var urlencodedParser = bodyParser.urlencoded({ extended: false })

var jsonfile = require('jsonfile');
var util = require('util');
var async = require('async');

var file = './config/hdp.json';

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

    app.all('/invoke', urlencodedParser, function (req, res) {
        
        if (req.method !== 'GET' && req.method !== 'POST') {
            res.end(getErrorResponse('GET and POST are only allowed'));
            return;
        }
        
        var requestedFunction;
        if (req.method === 'GET') {
            requestedFunction = req.query['function'];
        } else if (req.method === 'POST') {
            reqeustedFunction = req.body.function;
        }
        
        logger.trace('Function "' + requestedFunction + '" has been requested');
        var functionStuff;
        var functionFound = 0;
        
        for (var i = 0; i < hdpJson['functions'].length; i++) {
            
            var requestedFunctionArray = requestedFunction.split('/');
            var currentFunctionArray = hdpJson['functions'][i]['name'].split('/');
            
            var equal = 1;
            
            var minLength = Math.min(currentFunctionArray.length, requestedFunctionArray.length);
            
            logger.trace('minLength: ' + minLength);
            
            for (var q = 0; q < minLength; q++) {
                
                logger.trace(requestedFunctionArray[q]);
                logger.trace(currentFunctionArray[q]);
                
                if (currentFunctionArray[q].startsWith(':')) {
                    logger.trace('Starts with :');
                    continue;
                }
                if (requestedFunctionArray[q] !== currentFunctionArray[q]) {
                    equal = 0;
                    break;
                }
            }
            
            
            //if (requestedFunction === hdpJson['functions'][i]['name']) {
            //if (regex.test(requestedFunction)) {
            if (equal === 1 && requestedFunctionArray.length === currentFunctionArray.length) {
                if (hdpJson['functions'][i]['method'] === req.method) {
                    functionStuff = hdpJson['functions'][i];
                    functionFound = 1;
                    break;
                }
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
                if (req.method === 'POST') {
                    obj[name] = req.body[name];
                } else if (req.method === 'GET') {
                    obj[name] = req.query[name];
                }
                
                if ('required' in functionStuff.inputParameters[j] && typeof obj[name] === 'undefined') {
                    logger.trace('Required parameter "' + name +  '" not passed');
                    res.end(getErrorResponse('Parameter "' + name + '" is required'));
                    return;
                }
                
                if ('in' in functionStuff.inputParameters[j] && !inArray(functionStuff.inputParameters[j]['in'], obj[name])) {
                    logger.trace('Parameter "' + name +  '" not passed in validation');
                    res.end(getErrorResponse('Parameter "' + name + '" should be in specific list'));
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

        var upstreamsArr = functionStuff.upstreams;
        if (req.query.deprecated === '1' && typeof functionStuff.deprecatedUpstreams !== 'undefined') {
            upstreamsArr = functionStuff.deprecatedUpstreams;
        }
        var randUpstream = uniqueRandomArray(upstreamsArr);
        var selectedUpstream = randUpstream();
        
        logger.trace('Going to: ' + selectedUpstream + requestedFunction + querySuffix);

        sendRequestToTheUpstream(selectedUpstream + requestedFunction + querySuffix, req.method, {}, res, functionStuff.cacheTime);
    });
    
    app.get('*', function(req, res) {
        res.redirect('/start');
    });
    
    app.listen(3000, '127.0.0.1');
    
    callback(null, '');
}

function sendRequestToTheUpstream(url, method, formParams, res, cacheTime) {
    
    if (method === 'GET') {
        logger.trace('Request method is GET');
        if (cacheTime > 0) {
            cache.get(url, function (err, value) {
                if (err) throw err;
                if (typeof value !== 'undefined') {
                    logger.trace('Found in cache');
                    res.end(getSuccessResponse(value));
                    return;
                } else {
                    sendGetRequest(url, res, cacheTime);
                    return;
                }
              });
        } else {
            sendGetRequest(url, res, cacheTime);
            return;
        }
        
    } else if (method === 'POST') {
        request.post(url,
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
        }).form(formParams);
    }
}

function sendGetRequest(url, res, cacheTime) {
    logger.trace('Url is not in cache');
    request.get({url:url},
        function(err, httpResponse, body) {
            if (err) {
                logger.error(err);
                res.end(getErrorResponse('Service unavailable'));
                return;
            } else {
                logger.trace('httpResponse.statusCode: ' + httpResponse.statusCode);
                logger.trace('body:');
                logger.trace(body);
                // key will expire in 60 seconds 
                cache.set(url, body, cacheTime, function (err, value) {
                  if (err) throw err;
                });
                res.end(getSuccessResponse(body));
                return;
            }
    });
}


function getSuccessResponse(message) {
    return JSON.stringify({"output" : message});
}

function getErrorResponse(error) {
    return JSON.stringify({"error" : error});
}