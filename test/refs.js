var test = require('tape')
var memdb = require('memdb')
var umbr = require('../')

test('ordered linear single target batch', function (t) {
  t.plan(3)
  var br = umbr(memdb())
  var rows = [
    { id: 'a', refs: [] },
    { id: 'b', refs: ['a'] },
    { id: 'c', refs: ['a'] },
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','c'])
    })
  })
})

test('ordered linear single target batch with link', function (t) {
  t.plan(3)
  var br = umbr(memdb())
  var rows = [
    { id: 'a', refs: [] },
    { id: 'b', refs: ['a'] },
    { id: 'c', refs: ['a'] },
    { id: 'd', refs: ['a'], links: ['c'] },
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d'])
    })
  })
})

test('unordered linear single target batch with link', function (t) {
  t.plan(3)
  var br = umbr(memdb())
  var rows = [
    { id: 'd', refs: ['a'], links: ['c'] },
    { id: 'b', refs: ['a'] },
    { id: 'c', refs: ['a'] },
    { id: 'a', refs: [] },
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d'])
    })
  })
})

test('unordered multi-insert single target batch with link', function (t) {
  t.plan(6)
  var br = umbr(memdb())
  var rows = [
    { id: 'd', refs: ['a'], links: ['c'] },
    { id: 'b', refs: ['a'] },
    { id: 'c', refs: ['a'] },
    { id: 'a', refs: [] },
  ]
  ;(function next (n) {
    if (n === rows.length) return check()
    br.batch([rows[n]], function (err) {
      t.error(err)
      next(n+1)
    })
  })(0)

  function check () {
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d'])
    })
  }
})
