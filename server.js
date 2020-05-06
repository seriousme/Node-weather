var port = 8080
var staticSite = __dirname + '/client/public'

// start the serial reader in the same process
require('./readSerial')

var express = require('express')
var app = express()
app.use('/', express.static(staticSite))
app.listen(port, function () { console.log('listening')})
