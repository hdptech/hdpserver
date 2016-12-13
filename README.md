# hdpserver

Application that serves all requests going from HDP clien apps
to a specific HDP server application.

## What for?

HDP Server is an entry point before your service or group of services.
It allows you to bring SOAP ideas without XML overhead, but with a whole new bunch
of stuff like load balancing, caching, validating data and so on.
You deploy your services. Then you deploy HDP server application before them.
You provide a list of available functions to this HDP server entry point.
This is your service for the rest of the world.
Everybody will peck into this entry point.
Entry point receives function a client want to address to and parameters (optional).
HDP server can validate function (is it available), input parameters, grab a response
from cache (if it is GET).
HDP server let's you have a balancing stuff - you can provide different upstreams
and entry point will choose a random one to pass a request. It also lets you
have a backward compability - you can deploy your old API somewhere and specify
deprecated upstreams list to route "old" clients there.

## Installation 

1) Clone this project:

```
git clone https://github.com/hdptech/hdpserver
```

2) Install Node.JS and npm

3) Copy config example:

```
cp config/hdp.json.example config/hdp.json
```

4) Fill `config/hdp.json` with your service functions.

5) Install dependencies:

```
cd hdpserver
npm install
```

6) Launch:

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
        "upstreams" : ["http://127.0.0.1:3001/", "http://127.0.0.1:3003"],
        "deprecatedUpstreams" : ["http://127.0.0.1:3002/"],
        "loadBalancing" : "roundRobin",
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

- `name` - Name of service of groups of services current HDP server handles
- `description` - Optional description of that service(s)
- `functions` - List of available functions

For each `function`:

- `name` - Function name to invoke
- `description` - Optional description of what that function does
- `upstreams` - Array of available upstreams where HDP server can randomly pass
current request. On each request HDP server will pick a random upstream and
pass a request to it.
- `deprecatedUpstreams` - Optional array that could handle requests for deprecated
API. It could help to cope with backward compability.
- `loadBalancing` - Optional. Defines load balancing algo which will be used to route
requests between different defined upstreams. Detailed info below.
- `method` - Request method. GET and POST are only supported by HDP protocol
- `inputParameters` - Optional array of objects. Each object describes single
input parameter. More details below.
- `cacheTime` - You can easily in-memory cache your GET request's response by
setting cacheTime more than zero. It will mean that for some time requests won't
peck your upstream service and is gonna be served by HDP grabbing a response
from cache.

For each input parameter:

- `name` - Parameter name
- `description` - Optional parameter description
- `boolean` - Optional boolean validation. It will check whether parameter is true or false.
- `compare` - Optional compare validation. Compares the specified attribute value with another
value and validates if they are equal.
- `date` - Optional date validation. Validates that the attribute value is a valid date,
time or datetime.
- `default` - Optional default validation. Sets the attributes with the specified value.
It does not do validation. Its existence is mainly to allow specifying
attribute default values in a dynamic way.
- `email` - Optional email validation. Validates that the attribute value is a valid
email address.
- `length` - Optional length validation. Validates that the attribute value is of
certain length.
- `numerical` - Optional numerical validation. Validates that the attribute value is a number.
- `regex` - Optional regex validation. Validates that the attribute value
matches to the specified regular expression.
- `required` - Optional required validation. If set to true and param not passed
by a client - it will break the request workflow with an error.
- `in` - Optional in validation. It will check whether the passed parameter is
in array provided by validation rule.
- `url` - Optional URL validation. Validates that the attribute value is
a valid URL.

## Load balancing

Available options:

- roundRobin
- weightedRoundRobin
- upstreamResponseTime
- leastConnections
- upstreamMeasure


Load balancing could be set to handle incoming requests for one function between
different upstreams. `roundRobin` option is set by default means that this algo
will be used to route requests. `upstreamResponseTime` and `leastConnections` don't
require any more configuration to be set because these indicators will be tracked
automatically. For `weightedRoundRobin` you have to put weights for upstreams:

```
"functions" : [
    {
        "upstreams" : ["http://127.0.0.1:3001/", "http://127.0.0.1:3003"],
        "loadBalancing" : "weightedRoundRobin",
        "loadBalancingWeights" : [0.3, 0.7],
    },
```

`upstreamMeasure` is a custom measure tool that allows you to grab info from
all upstreams to define the load balancing stuff on the fly. For example, you may
want to route most of your requests to an upstream with the lowest LA (load average).

For the `upstreamMeasure` setting this proxy will expect to grab info about each
upstream using a specific URL: `/measure` and expecting one letter to be assigned: `7.3`.

Then proxy will handle this stuff like weighted round robin for some time before
requesting `/measure` once more to change weights.

You can use several plugins like `measureLoadAverage`, `measureMemoryUsage` etc to
implement desired logic.

List of algos:

- loadAverageLess
- memoryUsageLess
- cpuUsageLess
- networkTrafficLess
- diskIOLess
- swapIOLess

You can combine them or even assing a weight to every plugin in this list to work.