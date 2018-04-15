var REF = 'r!'
var ORIGIN = 'o!'
var LINK = 'l!'

module.exports = Refs

function Refs (db, opts) {
  if (!(this instanceof Refs)) return new Refs(db, opts)
  this._db = db
  this._writing = false
  this._writeQueue = []
}

Refs.prototype.batch = function (docs, cb) {
  var self = this
  if (self._writing) return self._writeQueue.push(docs, cb)
  self._writing = true

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
  var remove = {}
  docs.forEach(function (doc) {
    ;(doc.links || []).forEach(function (link) {
      remove[link] = true
      batch.push({
        type: 'put',
        key: LINK + link,
        value: ''
      })
    })
  })
  var refs = {}
  var pending = 1
  docs.forEach(function (doc) {
    pending++
    self._db.get(LINK + doc.id, function (err, value) {
      if (value !== undefined) remove[doc.id] = true
      if (--pending === 0) scanRemovals()
    })
  })
  Object.keys(refSet).forEach(function (ref) {
    pending++
    self._db.get(REF + ref, function (err, value) {
      refs[ref] = {}
      if (value) {
        JSON.parse(value).forEach(function (id) {
          if (!remove[id]) refs[ref][id] = true
        })
      }
      if (--pending === 0) scanRemovals()
    })
  })
  if (--pending === 0) scanRemovals()

  function scanRemovals () {
    // queue extra references to load
    var pending = 1
    var loadRef = {}
    Object.keys(remove).forEach(function (key) {
      pending++
      self._db.get(ORIGIN + key, function (err, value) {
        if (value) {
          var ids = JSON.parse(value)
          ids.forEach(function (id) {
            if (!refs[id]) loadRef[id] = true
          })
        }
        if (--pending === 0) loadExtraRefs(loadRef)
      })
    })
    if (--pending === 0) loadExtraRefs(loadRef)
  }

  function loadExtraRefs (extra) {
    var pending = 1
    Object.keys(extra).forEach(function (ref) {
      pending++
      self._db.get(REF + ref, function (err, value) {
        if (value) {
          var newValue = JSON.parse(value)
            .filter(function (id) { return !remove[id] })
          batch.push({
            type: 'put',
            key: REF + ref,
            value: JSON.stringify(newValue)
          })
        }
        if (--pending === 0) finish()
      })
    })
    if (--pending === 0) finish()
  }

  function finish () {
    docs.forEach(function (doc) {
      ;(doc.refs || []).forEach(function (ref) {
        if (!remove[doc.id]) {
          refs[ref][doc.id] = true
        }
      })
    })
    Object.keys(refs).forEach(function (ref) {
      batch.push({
        type: 'put',
        key: REF + ref,
        value: JSON.stringify(Object.keys(refs[ref]))
      })
    })
    self._db.batch(batch, function (err) {
      if (err) cb(err)
      else cb()
      self._writing = false
      if (self._writeQueue.length > 0) {
        var wdocs = self._writeQueue.shift()
        var wcb = self._writeQueue.shift()
        self.batch(wdocs, wcb)
      }
    })
  }
}

Refs.prototype.get = function (key, cb) {
  var self = this
  self._db.get(REF + key, function (err, values) {
    cb(null, values ? JSON.parse(values.toString()) : [])
  })
}
