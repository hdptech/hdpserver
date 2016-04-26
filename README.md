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
