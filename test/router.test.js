import assert from 'assert';
import Router, { Node } from '../src/router';

describe('Router', () => {
  let r;
  beforeEach(() => {
    r = new Router();
  });

  it('static', () => {
    r.add('GET', '/folders/files/bolt.gif', () => {})
    let [h, params] = r.find('GET', '/folders/files/bolt.gif');
    assert.notEqual(null, h);
    let result = r.find('GET', '/folders/files/bolt.hash.gif');
    assert.equal(null, result[0]);
    let result2 = r.find('GET', '/folders/bolt .gif');
    assert.equal(null, result2[0]);
  });

  it('catch all', () => {
    r.add('GET', '/static/*', () => {})
    let [h, params] = r.find('GET', '/static/*');
    assert.notEqual(null, h);
    let result = r.find('GET', '/static/js');
    assert.notEqual(null, result[0]);
    let result2 = r.find('GET', '/static/');
    assert.notEqual(null, result2[0]);
  });

  it('param', () => {
    r.add('GET', '/users/:id', () => {})
    let [h, params] = r.find('GET', '/users/233');
    assert.notEqual(null, h);
    assert.equal('id', params[0].name);
    assert.equal(233, params[0].value);
    let result = r.find('GET', '/users/2');
    assert.notEqual(null, result[0]);
    assert.equal('id', result[1][0].name);
    assert.equal(2, result[1][0].value);
  });

  it('params', () => {
    r.add('GET', '/users/:id/photos/:pid', () => {})
    let [h, params] = r.find('GET', '/users/233/photos/377');
    assert.notEqual(null, h);
    assert.equal('id', params[0].name);
    assert.equal(233, params[0].value);
    assert.equal('pid', params[1].name);
    assert.equal(377, params[1].value);
  });

  describe('Node', () => {
    let node;
    beforeEach(() => {
      node = new Node('/users');
    });

    it('create a node', () => {
      assert.equal('/users', node.prefix);
      assert.equal('/', node.label);
    });
  });
});
