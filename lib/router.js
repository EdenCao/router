'use strict';

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

exports.__esModule = true;
/*!
 * router
 * Copyright(c) 2015 Fangdun Cai
 * MIT Licensed
 */

const min = Math.min;

const METHODS = ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'];

const SNODE = 1; // Static node
const PNODE = 2; // Param node
const CNODE = 3; // Catch-all node

/**
 * Node
 *
 * @class Node
 * @constructor
 */

var Node = (function () {
  function Node(prefix, has, handler, edges) {
    _classCallCheck(this, Node);

    this.label = prefix.charCodeAt(0);
    this.prefix = prefix;
    this.has = has;
    this.handler = handler;
    this.edges = edges || [];
  }

  Node.prototype.findEdge = function findEdge(c) {
    var i = 0;
    var l = this.edges.length;
    var e = undefined;

    for (; i < l; ++i) {
      e = this.edges[i];
      // compare charCode
      if (e.label === c) return e;
    }
    return undefined;
  };

  return Node;
})();

/**
 * Router
 *
 * @class Router
 * @constructor
 */

var Router = (function () {
  function Router() {
    var _this = this;

    _classCallCheck(this, Router);

    this.trees = Object.create(null);
    METHODS.forEach(function (m) {
      _this.trees[m.toUpperCase()] = new Node('', null, null, []);
    });
  }

  /**
   * Add new route
   *
   * @method add
   * @param {String} method
   * @param {String} path
   * @param {Function|GeneratorFunction} handler
   */

  Router.prototype.add = function add(method, path, handler) {
    // count params
    var count = -1;
    // store param keys
    var keys = [];
    if (handler) handler.keys = keys;

    var i = 0,
        l = path.length,
        ch = undefined;
    for (; i < l; ++i) {
      ch = path.charCodeAt(i);
      if (ch === 58 /*':'*/) {
        // param start index
        var j = i + 1;
        count++;

        this.insert(method, path.slice(0, i), null, PNODE);
        for (; i < l && path.charCodeAt(i) !== 47 /*'/'*/; ++i) {}

        // new param key `$n`
        var param = '$' + count;
        var prefix = path.slice(0, j) + param;
        // store original param key
        keys.push(path.slice(j, i));
        // override path
        path = prefix + path.slice(i);
        // override i, l
        i = prefix.length;
        l = path.length;

        if (i === l) {
          this.insert(method, path.slice(0, i), handler, 0);
          return;
        }
        this.insert(method, path.slice(0, i), null, 0);
      } else if (ch === 42 /*'*'*/) {
        this.insert(method, path.slice(0, i), null, CNODE);
        this.insert(method, path.slice(0, l), handler, 0);
      }
    }
    this.insert(method, path, handler, SNODE, true);
  };

  /**
   * Insert new route
   *
   * @method insert
   * @private
   * @param {String} method
   * @param {String} path
   * @param {Function|GeneratorFunction} handler
   * @param {Number} has
   * @param {Boolean} [bool=false] if bool is true, unshift it to edges
   */

  Router.prototype.insert = function insert(method, path, handler, has) {
    var bool = arguments[4] === undefined ? false : arguments[4];

    var cn = this.trees[method]; // Current node as root
    var search = path;

    while (true) {
      var sl = search.length;
      var pl = cn.prefix.length;
      var l = lcp(search, cn.prefix);

      if (l === 0) {
        // At root node
        cn.label = search.charCodeAt(0);
        cn.prefix = search;
        cn.has = has;
        if (handler) {
          cn.handler = handler;
        }
      } else if (l < pl) {
        // Split node
        var n = new Node(cn.prefix.slice(l), cn.has, cn.handler, cn.edges);
        cn.edges = [n]; // Add to parent

        // Reset parent node
        cn.label = cn.prefix.charCodeAt(0);
        cn.prefix = cn.prefix.slice(0, l);
        cn.has = 0;
        cn.handler = null;

        if (l === sl) {
          // At parent node
          cn.handler = handler;
        } else {
          // Need to fork a node
          var _n = new Node(search.slice(l), has, handler);
          // cn.edges.push(n);
          cn.edges[bool ? 'unshift' : 'push'](_n);
        }
      } else if (l < sl) {
        search = search.slice(l);
        var e = cn.findEdge(search.charCodeAt(0));
        if (e) {
          // Go deeper
          cn = e;
          continue;
        }
        // Create child node
        var n = new Node(search, has, handler);
        // cn.edges.push(n);
        cn.edges[bool ? 'unshift' : 'push'](n);
      } else {
        // Node already exists
        if (handler) {
          cn.handler = handler;
        }
      }
      return;
    }
  };

  /**
   * Find route by method and path
   *
   * @method find
   * @param {String} method
   * @param {String} path
   * @param {Node} [cn]
   * @param {Number} {n=0}
   * @param {Array} {params=[]}
   * @return {Array} result
   * @property {NULL|Function|GeneratorFunction} result[0]
   * @property {Array} result[1]
   */

  Router.prototype.find = function find(method, path, cn) {
    var n = arguments[3] === undefined ? 0 : arguments[3];
    var params = arguments[4] === undefined ? [] : arguments[4];

    cn = cn || this.trees[method];
    var search = path;
    var result = Array(2);
    result[1] = params;

    if (search.length === 0 || search === cn.prefix) {
      result[0] = cn.handler;
      if (cn.handler && cn.handler.keys) {
        for (var _i = 0, _l = cn.handler.keys.length; _i < _l; ++_i) {
          params[_i].name = cn.handler.keys[_i];
        }
      }
      return result;
    }

    var pl = cn.prefix.length;
    var l = lcp(search, cn.prefix);
    if (l === pl) {
      search = search.slice(l);
    }

    var i = 0,
        k = cn.edges.length,
        e = undefined;
    for (; i < k; ++i) {
      e = cn.edges[i];
      var has = e.label === 58 /*':'*/ ? PNODE : e.label === 42 /*'*'*/ ? CNODE : 0;
      if (has === PNODE) {
        l = search.length;
        var j = 0;
        for (; j < l && search.charCodeAt(j) !== 47 /*'/'*/; ++j) {}

        params[n] = {
          name: e.prefix.slice(1),
          value: search.slice(0, j)
        };
        n++;
        search = search.slice(j);
      } else if (has === CNODE) {
        params[n] = {
          name: '_name',
          value: search
        };
        search = '';
      }

      var x = cn.findEdge(search.charCodeAt(0));
      if (x === undefined) {
        result = this.find(method, search, e, n, params);
        // if (result[0]) break;
      } else {
        result = this.find(method, search, x, n, params);
        if (result[0]) break;
      }
    }

    return result;
  };

  return Router;
})();

// Length of longest common prefix
function lcp(a, b) {
  var i = 0;
  var max = min(a.length, b.length);
  for (; i < max && a.charCodeAt(i) === b.charCodeAt(i); ++i) {}
  return i;
}

Router.Node = Node;

exports['default'] = Router;
module.exports = exports['default'];