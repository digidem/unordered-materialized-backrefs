var umbr = require('../')
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
