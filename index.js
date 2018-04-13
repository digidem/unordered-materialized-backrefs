var REF = 'r!'
var ORIGIN = 'o!'
var LINK = 'l!'

module.exports = Refs

function Refs (db, opts) {
  if (!(this instanceof Refs)) return new Refs(db, opts)
  this._db = db
}

Refs.prototype.batch = function (docs, cb) {
  var self = this
  var batch = []
  var refSet = {}
  docs.forEach(function (doc) {
    ;(doc.refs || []).forEach(function (ref) {
      refSet[ref] = true
    })
    batch.push({
      type: 'put',
      key: ORIGIN + doc.id,
      value: JSON.stringify(doc.refs)
    })
  })
  var refs = {}
  var pending = 1
  Object.keys(refSet).forEach(function (ref) {
    pending++
    self._db.get(REF + ref, function (err, value) {
      refs[ref] = {}
      if (value) {
        JSON.parse(value).forEach(function (id) {
          refs[ref][id] = true
        })
      }
      if (--pending === 0) fromRefs()
    })
  })
  var linkIds = {}, links = {}
  docs.forEach(function (doc) {
    ;(doc.links || []).forEach(function (link) {
      linkIds[link] = true
    })
  })
  var rmRefs = {}
  Object.keys(linkIds).forEach(function (link) {
    pending++
    self._db.get(ORIGIN + link, function (err, value) {
      if (value) {
        JSON.parse(value).forEach(function (ref) {
          if (!rmRefs[ref]) rmRefs[ref] = []
          rmRefs[ref].push(link)
        })
      }
      if (--pending === 0) fromRefs()
    })
  })
  if (--pending === 0) fromRefs()

  function fromRefs () {
    Object.keys(rmRefs).forEach(function (ref) {
      if (refs[ref]) {
        rmRefs[ref].forEach(function (id) {
          delete refs[ref][id]
        })
      } else { // need to load these other docs to remove refs
        console.log('TODO',ref,rmRefs[ref])
      }
    })
    finish()
  }
  function finish () {
    docs.forEach(function (doc) {
      ;(doc.refs || []).forEach(function (ref) {
        refs[ref][doc.id] = true
      })
    })
    Object.keys(refs).forEach(function (ref) {
      batch.push({
        type: 'put',
        key: REF + ref,
        value: JSON.stringify(Object.keys(refs[ref]))
      })
    })
    self._db.batch(batch, cb)
  }
}

Refs.prototype.get = function (key, cb) {
  var self = this
  self._db.get(REF + key, function (err, values) {
    cb(null, values ? JSON.parse(values.toString()) : [])
  })
}
