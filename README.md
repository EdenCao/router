# trek-router

A fast HTTP router, inspired by [Echo](https://github.com/labstack/echo)'s Router.

  [![NPM version][npm-img]][npm-url]
  [![Build status][travis-img]][travis-url]
  [![Test coverage][coveralls-img]][coveralls-url]
  [![License][license-img]][license-url]
  [![Dependency status][david-img]][david-url]


## Benchmarks

See [benchmarks](benchmarks), use [GitHub API Routes][] and [Discourse API Routes][].

**VS**

* [path-to-regexp][]
* [route-recognizer][]
* [route-trie][]
* [routington][]

```bash
$ npm run benchmark

GitHub API, 203 routes:
trek-router x 5,095 ops/sec ±2.26% (98 runs sampled)
memoryUsage: { rss: 42135552, heapTotal: 32478208, heapUsed: 18689464 }
path-to-regexp x 408 ops/sec ±1.58% (93 runs sampled)
memoryUsage: { rss: 60882944, heapTotal: 51053056, heapUsed: 16037648 }
route-recognizer x 323 ops/sec ±1.27% (90 runs sampled)
memoryUsage: { rss: 63623168, heapTotal: 54136832, heapUsed: 28968984 }
route-trie x 1,229 ops/sec ±1.12% (95 runs sampled)
memoryUsage: { rss: 65597440, heapTotal: 55168768, heapUsed: 27494288 }
routington x 1,201 ops/sec ±0.30% (98 runs sampled)
memoryUsage: { rss: 68001792, heapTotal: 59284480, heapUsed: 28473048 }
Fastest is trek-router

Discourse API, 359 routes:
trek-router x 3,801 ops/sec ±0.09% (101 runs sampled)
memoryUsage: { rss: 70402048, heapTotal: 61348352, heapUsed: 30221032 }
path-to-regexp x 59.41 ops/sec ±0.23% (78 runs sampled)
memoryUsage: { rss: 72286208, heapTotal: 63400192, heapUsed: 28175392 }
route-recognizer x 211 ops/sec ±1.14% (92 runs sampled)
memoryUsage: { rss: 75005952, heapTotal: 64432128, heapUsed: 21000584 }
route-trie x 1,131 ops/sec ±0.85% (97 runs sampled)
memoryUsage: { rss: 74936320, heapTotal: 64432128, heapUsed: 18404472 }
routington x 1,076 ops/sec ±0.45% (100 runs sampled)
memoryUsage: { rss: 74973184, heapTotal: 64432128, heapUsed: 25122008 }
Fastest is trek-router
```

## Usage

```js
import http from 'http';
import finalhandler from 'finalhandler';
import Router from 'trek-router';

let router = Router()

// static route
router.add('GET', '/folders/files/bolt.gif', () => {});
// param route
router.add('GET', '/users/:id', () => {});
// match-any route
router.add('GET', '/books/*', () => {});

let result = router.find('GET', '/users/233')
// => [handler, params]
// => [()=>{}, [{name: id, value: 233}]]

let params
if (result[0]) {
  result[1].forEach(param => params[param.name] = param.value)
  // => { id: 233 }
}

// Not Found
let result = router.find('GET', '/photos/233')
// => [handler, params]
// => [undefined, []]

// Or use HTTP Verb function to add path
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Hello World!');
});

let server = http.createServer(function(req, res) {
  let result = router.find(req.method, req.url);
  if (result) {
    req.params = result[1];
    return result[0](req, res);
  }
  finalhandler(req, res);
});

server.listen(3000)
```

## License

  [MIT](LICENSE)

[path-to-regexp]: https://github.com/pillarjs/path-to-regexp
[route-recognizer]: https://github.com/tildeio/route-recognizer
[route-trie]: https://github.com/zensh/route-trie
[routington]: https://github.com/pillarjs/routington

[GitHub API Routes]: test/fixtures/github-api.js
[Discourse API Routes]: test/fixtures/discourse-api.js

[npm-img]: https://img.shields.io/npm/v/trek-router.svg?style=flat-square
[npm-url]: https://npmjs.org/package/trek-router
[travis-img]: https://img.shields.io/travis/trekjs/router.svg?style=flat-square
[travis-url]: https://travis-ci.org/trekjs/router
[coveralls-img]: https://img.shields.io/coveralls/trekjs/router.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/trekjs/router
[license-img]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: LICENSE
[david-img]: https://img.shields.io/david/trekjs/router.svg?style=flat-square
[david-url]: https://david-dm.org/trekjs/router
