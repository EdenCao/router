/*!
 * router
 * Copyright(c) 2015 Fangdun Cai
 * MIT Licensed
 */

const METHODS = [
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE'
];

const SNODE = 1; // Static node
const PNODE = 2; // Param node
const CNODE = 3; // Catch-all node

class Node {

  constructor(prefix, has, handler, edges) {
    this.label = prefix.charCodeAt(0);
    this.prefix = prefix;
    this.has = has;
    this.handler = handler;
    this.edges = edges;
    if (!edges) this.edges = [];
  }

  findEdge(c) {
    let [i, l, e] = [0, this.edges.length, void 0];
    for (; i < l; i++) {
      e = this.edges[i];
      // compare charCode
      if (e.label === c) return e;
    }
    return null;
  }

}

class Router {

  constructor() {
    this.trees = Object.create(null);
    METHODS.forEach((m) => {
      this.trees[m.toUpperCase()] = new Node('', null, null, []);
    });
  }

  add(method, path, handler) {
    // count params
    let count = -1;
    // store param keys
    let keys = [];
    if (handler) handler.keys = keys;

    for (let i = 0, l = path.length; i < l; i++) {
      // `:`
      if (path.charCodeAt(i) === 58) {
        // param start index
        let j = i + 1;
        count++;

        this.insert(method, path.substring(0, i), null, PNODE);
        // `/`
        for (; i < l && (path.charCodeAt(i) !== 47); i++) {}

        // new param key `$n`
        let param = '$' + count;
        let prefix = path.substring(0, j) + param;
        // store original param key
        keys.push(path.substring(j, i));
        // override path
        path = prefix + path.substring(i);
        // override i, l
        i = prefix.length;
        l = path.length;

        if (i === l) {
          this.insert(method, path.substring(0, i), handler, 0);
          return;
        }
        this.insert(method, path.substring(0, i), null, 0);
        // `*`
      } else if (path.charCodeAt(i) === 42) {
        this.insert(method, path.substring(0, i), null, CNODE);
        this.insert(method, path.substring(0, l), handler, 0);
      }
    }
    this.insert(method, path, handler, SNODE, true);
  }

  // if bool is ture, push it to the top index of edges
  insert(method, path, handler, has, bool = false) {
    let cn = this.trees[method]; // Current node as root
    let search = path;

    while (true) {
      let sl = search.length;
      let pl = cn.prefix.length;
      let l = lcp(search, cn.prefix);

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
        let n = new Node(cn.prefix.substring(l), cn.has, cn.handler, cn.edges);
        cn.edges = [n]; // Add to parent

        // Reset parent node
        cn.label = cn.prefix.charCodeAt(0);
        cn.prefix = cn.prefix.substring(0, l);
        cn.has = 0;
        cn.handler = null;

        if (l === sl) {
          // At parent node
          cn.handler = handler;
        } else {
          // Need to fork a node
          let n = new Node(search.substring(l), has, handler, null);
          // cn.edges.push(n);
          cn.edges[bool ? 'unshift' : 'push'](n);
        }
      } else if (l < sl) {
        search = search.substring(l);
        let e = cn.findEdge(search.charCodeAt(0));
        if (e) {
          // Go deeper
          cn = e;
          continue;
        }
        // Create child node
        let n = new Node(search, has, handler, null);
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
  }

  find(method, path, cn, n = 0, params = []) {
    cn = cn || this.trees[method];
    let search = path;
    let result = [null, params];

    if (search.length === 0 || search === cn.prefix) {
      result[0] = cn.handler;
      if (cn.handler && cn.handler.keys) {
        cn.handler.keys.forEach((a, i) => {
          params[i].name = a;
        });
      }
      return result;
    }

    let pl = cn.prefix.length;
    let l = lcp(search, cn.prefix);
    if (l === pl) {
      search = search.substring(l);
    }

    for (let i = 0, k = cn.edges.length, e; i < k; i++) {
      e = cn.edges[i];
      let has = e.label === 58 ? PNODE : (e.label === 42 ? CNODE : 0);
      if (has === PNODE) {
        l = search.length;
        // `/`
        for (var j = 0; j < l && (search.charCodeAt(j) !== 47); j++) {}

        params[n] = {
          name: e.prefix.substring(1),
          value: search.substring(0, j)
        };
        n++;
        search = search.substring(j);
      } else if (has === CNODE) {
        params[n] = {
          name: '_name',
          value: search
        };
        search = '';
      }

      let x = cn.findEdge(search.charCodeAt(0));
      if (x) {
        result = this.find(method, search, x, n, params);
        if (result[0]) break;
      } else {
        result = this.find(method, search, e, n, params);
        // if (result[0]) break;
      }
    }

    return result;
  }

}

// Length of longest common prefix
function lcp(a, b) {
  let i = 0;
  let max = Math.min(a.length, b.length);
  for (; i < max && (a.charCodeAt(i) === b.charCodeAt(i)); i++) {}
  return i;
}

Router.Node = Node;

export default Router;
