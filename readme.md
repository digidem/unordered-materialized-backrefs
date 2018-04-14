# unordered-materialized-backrefs

materialized view to calculate back-references for unordered log messages

Use this library as a materialized view to track back-references for append-only
log data which can be inserted in any order. Back-references let you query for
which set of documents points at another document.

# example

``` js
var umbr = require('unordered-materialized-backrefs')
var db = require('level')('/tmp/br.db')
var br = umbr(db)

if (process.argv[2] === 'insert') {
  var doc = JSON.parse(process.argv[3])
  br.batch([doc], function (err) {
    if (err) console.error(err)
  })
} else if (process.argv[2] === 'get') {
  var key = process.argv[3]
  br.get(key, function (err, ids) {
    if (err) console.error(err)
    else console.log(ids)
  })
}
```

you can insert documents and query which documents link to which other
documents:

```
$ rm -rf /tmp/br.db \
&& node refs.js insert '{"id":"a","refs":[]}' \
&& node refs.js insert '{"id":"b","refs":["a"]}' \
&& node refs.js insert '{"id":"c","refs":["a"]}'
$ node refs.js get a
[ 'b', 'c' ]
```

the linked-to documents need not exist:

```
$ rm -rf /tmp/br.db \
&& node refs.js insert '{"id":"b","refs":["a"]}' \
&& node refs.js insert '{"id":"c","refs":["a"]}'
$ node refs.js get a
[ 'b', 'c' ]
```

linking replaces refs:

```
$ rm -rf /tmp/br.db \
&& node refs.js insert '{"id":"a","refs":[]}' \
&& node refs.js insert '{"id":"b","refs":["a"]}' \
&& node refs.js insert '{"id":"c","refs":["a"]}' \
&& node refs.js insert '{"id":"d","refs":["a"],"links":["c"]}'
$ node refs.js get a
[ 'b', 'd' ]
```

when you replace a document by linking, you remove its refs:

```
$ rm -rf /tmp/br.db \
&& node refs.js insert '{"id":"a","refs":[]}' \
&& node refs.js insert '{"id":"b","refs":[]}' \
&& node refs.js insert '{"id":"c","refs":["a"]}' \
&& node refs.js insert '{"id":"d","refs":["a"]}' \
&& node refs.js insert '{"id":"e","refs":["b"],"links":["d"]}'
$ node refs.js get a
[ 'c' ]
$ node refs.js get b
[ 'e' ]
```

documents can be inserted in any order:

```
$ rm -rf /tmp/br.db \
&& node refs.js insert '{"id":"a","refs":[]}' \
&& node refs.js insert '{"id":"b","refs":[]}' \
&& node refs.js insert '{"id":"c","refs":["a"]}' \
&& node refs.js insert '{"id":"d","refs":["a"]}' \
&& node refs.js insert '{"id":"e","refs":["b"],"links":["d"]}'
$ node refs.js get a
[ 'c' ]
$ node refs.js get b
[ 'e' ]
```

# api

``` js
var umbr = require('unordered-materialized-backrefs')
```

## var br = umbr(db, opts)

Create a `br` instance from a [leveldb][] instance `db` (levelup or leveldown).

Only the `db.batch()` and `db.get()` interfaces of leveldb are used with no
custom value encoding, so you can use any interface that supports these methods.

[leveldb]: https://github.com/Level/level

## br.batch(rows, cb)

Write an array of `rows` into the `kv`. Each `row` in the `rows` array has:

* `row.id` - unique id string of this record
* `row.refs` - array of string ids that the current id links to
* `row.links` - array of id string ancestor links

## br.get(id, cb)

Lookup the ids that link to the given `id` as `cb(err, ids)`.

# license

BSD
