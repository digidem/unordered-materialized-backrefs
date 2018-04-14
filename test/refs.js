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
    { id: 'a', refs: [] }
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d'])
    })
  })
})

test('ordered multi-insert single target batch with link', function (t) {
  t.plan(6)
  var br = umbr(memdb())
  var rows = [
    { id: 'a', refs: [] },
    { id: 'b', refs: ['a'] },
    { id: 'c', refs: ['a'] },
    { id: 'd', refs: ['a'], links: ['c'] }
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

test('ordered batch multi-target with links', function (t) {
  t.plan(5)
  var br = umbr(memdb())
  var rows = [
    { id: 'a', refs: [] },
    { id: 'b', refs: [] },
    { id: 'c', refs: ['a'] },
    { id: 'd', refs: ['b'] },
    { id: 'e', refs: ['a'], links: ['d'] }
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['c','e'])
    })
    br.get('b', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  })
})

test('ordered multi-insert multi-target with links', function (t) {
  t.plan(9)
  var br = umbr(memdb())
  var rows = [
    { id: 'a', refs: [] },
    { id: 'b', refs: [] },
    { id: 'c', refs: ['a'] },
    { id: 'd', refs: ['b'] },
    { id: 'e', refs: ['a'], links: ['d'] }
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
      t.deepEqual(ids.sort(), ['c','e'])
    })
    br.get('b', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  }
})

test('multiple refs one batch ordered', function (t) {
  t.plan(9)
  var br = umbr(memdb())
  var rows = [
    { id: 'x', refs: [] },
    { id: 'y', refs: [] },
    { id: 'z', refs: [] },
    { id: 'w', refs: [] },
    { id: 'a', refs: [] },
    { id: 'b', refs: ['x','y'] },
    { id: 'c', refs: ['x'] },
    { id: 'd', refs: ['y','z'] },
    { id: 'e', refs: ['x','y','z'] },
    { id: 'f', refs: ['y'] }
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('x', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','c','e'])
    })
    br.get('y', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d','e','f'])
    })
    br.get('z', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['d','e'])
    })
    br.get('w', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  })
})

test('multiple refs one batch unordered', function (t) {
  t.plan(9)
  var br = umbr(memdb())
  var rows = [
    { id: 'b', refs: ['x','y'] },
    { id: 'x', refs: [] },
    { id: 'w', refs: [] },
    { id: 'e', refs: ['x','y','z'] },
    { id: 'c', refs: ['x'] },
    { id: 'y', refs: [] },
    { id: 'd', refs: ['y','z'] },
    { id: 'a', refs: [] },
    { id: 'f', refs: ['y'] },
    { id: 'z', refs: [] }
  ]
  br.batch(rows, function (err) {
    t.error(err)
    br.get('x', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','c','e'])
    })
    br.get('y', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d','e','f'])
    })
    br.get('z', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['d','e'])
    })
    br.get('w', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  })
})

test('multiple refs 4-batch unordered', function (t) {
  t.plan(12)
  var br = umbr(memdb())
  var batches = [
    [
      { id: 'b', refs: ['x','y'] },
      { id: 'x', refs: [] },
      { id: 'w', refs: [] },
    ],
    [
      { id: 'e', refs: ['x','y','z'] },
      { id: 'c', refs: ['x'] },
      { id: 'y', refs: [] },
      { id: 'd', refs: ['y','z'] },
    ],
    [
      { id: 'a', refs: [] },
      { id: 'f', refs: ['y'] }
    ],
    [
      { id: 'z', refs: [] }
    ]
  ]
  ;(function next (n) {
    if (n === batches.length) return check()
    br.batch(batches[n], function (err) {
      t.error(err)
      next(n+1)
    })
  })(0)
  function check () {
    br.get('x', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','c','e'])
    })
    br.get('y', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','d','e','f'])
    })
    br.get('z', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['d','e'])
    })
    br.get('w', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  }
})

test('multiple refs 4-batch unordered with links', function (t) {
  t.plan(12)
  var br = umbr(memdb())
  var batches = [
    [
      { id: 'b', refs: ['x','y'] },
      { id: 'x', refs: [] },
      { id: 'w', refs: [] },
      { id: 'q', refs: ['w','z'], links: ['e'] },
    ],
    [
      { id: 'e', refs: ['x','y','z'] },
      { id: 'c', refs: ['x'] },
      { id: 'r', refs: ['x'], links: ['c'] },
      { id: 'y', refs: [] },
      { id: 'd', refs: ['y','z'] },
    ],
    [
      { id: 'a', refs: [] },
      { id: 'f', refs: ['y'] },
      { id: 's', refs: ['w','y'], links: ['d','r'] }
    ],
    [
      { id: 'z', refs: [] }
    ]
  ]
  ;(function next (n) {
    if (n === batches.length) return check()
    br.batch(batches[n], function (err) {
      t.error(err)
      next(n+1)
    })
  })(0)
  function check () {
    br.get('x', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b'])
    })
    br.get('y', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['b','f','s'])
    })
    br.get('z', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['q'])
    })
    br.get('w', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['q','s'])
    })
  }
})

test('replace ref batch', function (t) {
  t.plan(7)
  var br = umbr(memdb())
  var batch = [
    { id: 'a', refs: [] },
    { id: 'b', refs: ['a'] },
    { id: 'c', refs: ['b'], links: ['b'] }
  ]
  br.batch(batch, function (err) {
    t.error(err)
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
    br.get('b', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['c'])
    })
    br.get('c', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  })
})

test('replace ref multi-insert', function (t) {
  t.plan(9)
  var br = umbr(memdb())
  var batches = [
    [
      { id: 'a', refs: [] }
    ],
    [
      { id: 'b', refs: ['a'] }
    ],
    [
      { id: 'c', refs: ['b'], links: ['b'] }
    ]
  ]
  ;(function next (n) {
    if (n === batches.length) return check()
    br.batch(batches[n], function (err) {
      t.error(err)
      next(n+1)
    })
  })(0)
  function check () {
    br.get('a', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
    br.get('b', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), ['c'])
    })
    br.get('c', function (err, ids) {
      t.error(err)
      t.deepEqual(ids.sort(), [])
    })
  }
})
