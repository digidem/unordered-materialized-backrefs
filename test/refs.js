var test = require('tape')
var memdb = require('memdb')
var umbr = require('../')

test('in-order linear single target batch', function (t) {
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

test('in-order linear single target batch with link', function (t) {
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
