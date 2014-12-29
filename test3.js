var LevelUp = require('level')
var Sublevel = require('level-sublevel')
require ('./jsonDateParse')

var db = Sublevel(LevelUp('sublevel-example',{ valueEncoding: 'json' }))
var rddb = db.sublevel('rawdata')
var hrdb = db.sublevel('hour')
var daydb = db.sublevel('day')
var monthdb = db.sublevel('month')
var config = db.sublevel('config')

rddb.createReadStream({limit:2})
		.on('data', function (data) {
			//if (data.value.sensor == 'Buiten')
				console.log(JSON.stringify(data.value))
		})