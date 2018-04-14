var test = require('tape')
var memdb = require('memdb')
var umbr = require('../')

test('ordered random network', function (t) {
  var br = umbr(memdb())
  var store = { refs: [], objects: {} }
  var batches = []
  var uid = 0
  for (var i = 0; i < 10; i++) {
    var n = Math.floor(Math.random()*50)
    var batch = []
    for (var j = 1; j < n; j++) {
      var refs = []
      var r = uid > 0 ? Math.floor(Math.min(uid,3)*Math.random()) : 0
      for (var k = 0; k < r; k++) {
        var ref = Math.floor(Math.random()*uid)
        refs.push(ref)
        if (!store.refs[ref]) store.refs[ref] = []
        store.refs[ref].push(uid)
      }
      var links = []
      var r = uid > 0 ? Math.floor(Math.min(uid,2)*Math.random()) : 0
      for (var k = 0; k < r; k++) {
        var link = Math.floor(Math.random()*uid)
        links.push(link)
        store.objects[link].refs.forEach(function (ref) {
          store.refs[ref] = store.refs[ref].filter(function (r) {
            return r !== link
          })
        })
      }
      var doc = { id: uid, refs: refs, links: links }
      store.objects[uid] = doc
      batch.push(doc)
      uid++
    }
    batches.push(batch)
  }
  t.plan(batches.length + Object.keys(store.refs).length*2)

  ;(function next (n) {
    if (n === batches.length) return check()
    br.batch(batches[n], function (err) {
      t.error(err)
      next(n+1)
    })
  })(0)

  function check () {
    Object.keys(store.refs).forEach(function (id) {
      br.get(id, function (err, ids) {
        t.error(err)
        t.deepEqual(ids.sort(), store.refs[id].map(String).sort())
      })
    })
  }
})
