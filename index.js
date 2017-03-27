/*!
 * router
 * Copyright(c) 2015-2017 Fangdun Cai
 * MIT Licensed
 */

'use strict'

// `*` `/` `:`
const [STAR, SLASH, COLON] = [42, 47, 58]

/**
 * Route Node
 *
 * @class Node
 * @constructor
 * @param {String} path
 * @param {Array} [children]
 * @param {Function} handler
 * @param {Array} [pnames]
 */
class Node {

  constructor(prefix = '/', children = [], maps = Object.create(null)) {
    this.label = prefix.charCodeAt(0)
    this.prefix = prefix
    this.children = children
    this.maps = maps
  }

  /**
   * Find child node by charCode
   *
   * @param {Number} char code
   * @return {Node|undefined} node
   */
  findChild(c, l, e, i = 0) {
    for (l = this.children.length; i < l; i++) {
      e = this.children[i]
      // Compare charCode
      if (c === e.label) {
        return e
      }
    }
  }

  addMap(method, map) {
    this.maps[method] = map
  }

  findMap(method) {
    return this.maps[method]
  }

}

/**
 * Router
 *
 * @class Router
 * @constructor
 */
class Router {

  constructor() {
    this.tree = new Node()
  }

  /**
   * Add new route
   *
   * @method add
   * @param {String} method
   * @param {String} path
   * @param {Function} handler
   */
  add(method, path, handler) {
    // Pnames: Param names
    let [i, l, pnames, ch, j] = [0, path.length, []]

    for (; i < l; ++i) {
      ch = path.charCodeAt(i)
      if (ch === COLON) {
        j = i + 1

        this.insert(method, path.substring(0, i))
        for (; i < l && (path.charCodeAt(i) !== SLASH); ++i) {}

        pnames.push(path.substring(j, i))
        path = path.substring(0, j) + path.substring(i)
        i = j
        l = path.length

        if (i === l) {
          this.insert(method, path.substring(0, i), handler, pnames)
          return
        }
        this.insert(method, path.substring(0, i))
      } else if (ch === STAR) {
        this.insert(method, path.substring(0, i))
        this.insert(method, path.substring(0, l), handler, pnames)
        return
      }
    }
    this.insert(method, path, handler, pnames)
  }

  /**
   * Insert new route
   *
   * @method insert
   * @private
   * @param {String} method
   * @param {String} path
   * @param {Function} [handler]
   * @param {Array} [pnames]
   */
  insert(method, path, handler, pnames) {
    // Current node as root
    let [cn, prefix, sl, pl, l, max, n, c] = [this.tree]

    while (true) {
      prefix = cn.prefix
      sl = path.length
      pl = prefix.length
      l = 0

      // LCP
      max = sl < pl ? sl : pl
      for (; l < max && (path.charCodeAt(l) === prefix.charCodeAt(l)); ++l) {}

      /*
      If (l === 0) {
        // At root node
        cn.label = search.charCodeAt(0)
        cn.prefix = search
        if (handler !== undefined) {
          cn.addMap(method, { pnames, handler })
        }
      } else if (l < pl) {
      */
      if (l < pl) {
        // Split node
        n = new Node(prefix.substring(l), cn.children, cn.maps)
        cn.children = [n] // Add to parent

        // Reset parent node
        cn.label = prefix.charCodeAt(0)
        cn.prefix = prefix.substring(0, l)
        cn.maps = Object.create(null)

        if (l === sl) {
          // At parent node
          cn.addMap(method, {pnames, handler})
        } else {
          // Create child node
          n = new Node(path.substring(l), [])
          n.addMap(method, {pnames, handler})
          cn.children.push(n)
        }
      } else if (l < sl) {
        path = path.substring(l)
        c = cn.findChild(path.charCodeAt(0))
        if (c !== undefined) {
          // Go deeper
          cn = c
          continue
        }
        // Create child node
        n = new Node(path, [])
        n.addMap(method, {pnames, handler})
        cn.children.push(n)
      } else if (handler !== undefined) {
        // Node already exists
        cn.addMap(method, {pnames, handler})
      }
      return
    }
  }

  /**
   * Find route by method and path
   *
   * @method find
   * @param {String} method
   * @param {String} path
   * @return {Array} result
   * @property {Undefined|Function} result[0]
   * @property {Array} result[1]
   */
  find(method, path, cn, n, result) {
    cn = cn || this.tree // Current node as root
    n |= 0 // Param counter
    result = result || [undefined, []]
    let search = path
    let prefix = cn.prefix
    const params = result[1] // Params
    let i, pl, sl, l, max, c
    let preSearch // Pre search

    // Search order static > param > match-any
    if (search.length === 0 || search === prefix) {
      // Found
      const map = cn.findMap(method)
      if ((result[0] = map && map.handler) !== undefined) {
        const pnames = map.pnames
        if (pnames !== undefined) {
          for (i = 0, l = pnames.length; i < l; ++i) {
            params[i].name = pnames[i]
          }
        }
      }
      return result
    }

    sl = search.length
    pl = prefix.length
    l = 0

    // LCP
    max = sl < pl ? sl : pl
    for (; l < max && (search.charCodeAt(l) === prefix.charCodeAt(l)); ++l) {}

    if (l === pl) {
      search = search.substring(l)
    }
    preSearch = search

    // Static node
    c = cn.findChild(search.charCodeAt(0))
    if (c !== undefined) {
      this.find(method, search, c, n, result)
      if (result[0] !== undefined) {
        return result
      }
      search = preSearch
    }

    // Not found node
    if (l !== pl) {
      return result
    }

    // Param node
    c = cn.findChild(COLON)
    if (c !== undefined) {
      l = search.length
      for (i = 0; i < l && (search.charCodeAt(i) !== SLASH); ++i) {}

      params[n] = {
        value: search.substring(0, i)
      }

      n++
      preSearch = search
      search = search.substring(i)

      this.find(method, search, c, n, result)
      if (result[0] !== undefined) {
        return result
      }

      n--
      params.pop()
      search = preSearch
    }

    // Any node
    c = cn.findChild(STAR)
    if (c !== undefined) {
      params[n] = {
        name: '_*',
        value: search
      }
      search = '' // End search
      this.find(method, search, c, n, result)
    }

    return result
  }

}

Router.Node = Node

module.exports = Router
