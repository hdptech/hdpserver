var express = require('express')
var app = express()
 
app.get('/start', function (req, res) {
    // echo hdp.json meta data
    res.send('meta stuff');
});

app.get('/invoke', function (req, res) {
    // invoke a function with params
    res.send('invoke');
});

app.get('*', function(req, res) {
    res.redirect('/start');
});
 
app.listen(3000, '127.0.0.1');
