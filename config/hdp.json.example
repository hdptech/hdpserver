# hdpserver

Application that serves all requests going from HDP clien apps
to a specific HDP server application.

## Installation 

1) Clone this project:

```
git clone https://github.com/hdptech/hdpserver
```

2) Install Node.JS and npm

3) Install dependencies:

```
cd hdpserver
npm install
```

4) Launch:

```
node index.js
```

## Usage

Now you can send your requests:

```
$ curl 'http://127.0.0.1:3000/invoke?function=getDate&city=Moscow'
$ curl http://127.0.0.1:3000/invoke?function=getCaptcha
$ curl http://127.0.0.1:3000/invoke?function=withParam/foo/bar
```

## Configuration

App should be configured in a single config in `config` folder.

Example

```
{
    "name" : "Hdp service", 
    "description" : "Hdp service description",
    "functions" : [
    {
        "name" : "getDate",
        "description" : "Get this date please",
        "upstreams" : ["http://127.0.0.1:3001/"],
        "deprecatedUpstreams" : ["http://127.0.0.1:3002/"],
        "method" : "GET",
        "inputParameters" : [
        { 
            "name" : "city", 
            "description" : "City you like",
            "required" : true,
            "in" : ["Moscow", "Sochi"]
        }]
    },
    { 
        "name" : "getCaptcha", 
        "description" : "Returns captcha image",
        "upstreams" : ["http://127.0.0.1:3001/"],
        "cacheTime" : 60,
        "method" : "GET"
    },
    { 
        "name" : "withParam/:param/:more",
        "description" : "Returns with params",
        "upstreams" : ["http://127.0.0.1:3001/"],
        "method" : "GET"
    }]
}
```

### Parameters

`name` - Name of service of groups of services current HDP server handles
`description` - Optional description of that service(s)
`functions` - List of available functions

For each `function`:

`name` - Function name to invoke
`description` - Optional description of what that function does
`upstreams` - Array of available upstreams where HDP server can randomly pass
current request. On each request HDP server will pick a random upstream and
pass a request to it.
`deprecatedUpstreams` - Optional array that could handle requests for deprecated
API. It could help to cope with backward compability.
`method` - Request method. GET and POST are only supported by HDP protocol
`inputParameters` - Optional array of objects. Each object describes single
input parameter. More details below.
`cacheTime` - You can easily in-memory cache your GET request's response by
setting cacheTime more than zero. It will mean that for some time requests won't
peck your upstream service and is gonna be served by HDP grabbing a response
from cache.

For each input parameter:

`name` - Parameter name
`description` - Optional parameter description
`boolean` - Optional boolean validation. It will check whether parameter is true or false.
`compare` - Optional compare validation. Compares the specified attribute value with another
value and validates if they are equal.
`date` - Optional date validation. Validates that the attribute value is a valid date,
time or datetime.
`default` - Optional default validation. Sets the attributes with the specified value.
It does not do validation. Its existence is mainly to allow specifying
attribute default values in a dynamic way.
`email` - Optional email validation. Validates that the attribute value is a valid
email address.
`length` - Optional length validation. Validates that the attribute value is of
certain length.
`numerical` - Optional numerical validation. Validates that the attribute value is a number.
`regex` - Optional regex validation. Validates that the attribute value
matches to the specified regular expression.
`required` - Optional required validation. If set to true and param not passed
by a client - it will break the request workflow with an error.
`in` - Optional in validation. It will check whether the passed parameter is
in array provided by validation rule.
`url` - Optional URL validation. Validates that the attribute value is
a valid URL.
