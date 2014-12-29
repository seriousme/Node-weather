var nano = require('nano')('http://localhost:5984');

var LevelUp = require('level')
var Sublevel = require('level-sublevel')
//require ('./jsonDateParse')
//var db = Sublevel(LevelUp('sublevel-example'))
var db = Sublevel(LevelUp('sublevel-example',{ valueEncoding: 'json' }))
var rddb = db.sublevel('rawdata')

// clean up the database we created previously
nano.db.destroy('weatherdb', function() {
  // create a new database
  nano.db.create('weatherdb', function() {
    // specify the database we are going to use
    var weatherdb = nano.use('weatherdb');
    // and insert a document in it
	rddb.createReadStream({})
		.on('data', function (data) {
			//if (data.value.sensor == 'Buiten')
			//console.log(JSON.stringify(data.value))
			weatherdb.insert(data.value, data.key, function(err, body, header) {
			  if (err) {
				console.log('[weatherdb.insert] ', err.message);
				return;
			  }
			  //console.log('you have inserted')
			  //console.log(body);
			});
		})
  });
});