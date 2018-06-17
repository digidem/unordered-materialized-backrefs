var test = require('tape')
var memdb = require('memdb')
var umbr = require('../')

test('delete', function (t) {
  t.plan(3)
  var br = umbr(memdb())
  var rows = [
    { type: 'put', id: 'a', refs: [] },
    { type: 'put', id: 'b', refs: ['a'] },
    { type: 'put', id: 'c', refs: ['a'] },
    { type: 'put', id: 'd', refs: ['a'] },
    { type: 'del', id: 'd' }
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','c'])
    })
  })
})
