var test = require('tape')
var memdb = require('memdb')
var umbr = require('../')

test('multi-batch replace', function (t) {
  t.plan(5)
  var br = umbr(memdb())
  var batches = [
    [
      { type: 'put', id: 'a', refs: [] },
      { type: 'put', id: 'b', refs: ['a'] },
      { type: 'put', id: 'c', refs: ['a'] },
      { type: 'put', id: 'd', refs: ['a'] },
    ],
    [
      { type: 'put', id: 'd', refs: [], links: ['d'] }
    ]
  ]
  ;(function next (i) {
    if (i === batches.length) return check()
    br.batch(batches[i], function (err) {
      t.error(err)
      next(i+1)
    })
  })(0)

  function check (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','c'])
    })
  }
})
