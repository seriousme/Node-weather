var LevelUp = require('level')
var Sublevel = require('level-sublevel')
require ('./jsonDateParse')

var db = Sublevel(LevelUp('sublevel-example',{ valueEncoding: 'json' }))
var rddb = db.sublevel('rawdata')
var hrdb = db.sublevel('hour')
var daydb = db.sublevel('day')
var monthdb = db.sublevel('month')
var config = db.sublevel('config')

/* var record={ date: datestr,
				   id: id,
				   sensorid: data[2],
				   temp: Number(data[4]),
				   humid: Number(data[6]),
				   batt: data[7],
				   msg: msg
				}; */
	
/* var rec={ date: 'datestr',
		  sensor: 'sensor',
		  temp: {
					min: x,
					max: x,
					avg: x,
					cnt: x
					}
		  humid: {
					min: x,
					max: x,
					avg: x,
					cnt: x
					}
} */

// helper function to update min, max and average.
function setMinMaxAvg(result,rec){
	if (result.min > rec.min)
		result.min = rec.min
	if (result.max < rec.max)
		result.max = rec.max
	result.avg= ((result.cnt * result.avg) + rec.avg)/++result.cnt
	result.avg=Number((result.avg).toFixed(2));
}
			
// update the interval based on input data
function updateInterval(db,timestamp,rec){
	// make sure the key is unique across multiple sensors
	var key=timestamp.toJSON() + '|' + rec.sensor
	// check if there is an existing record
	db.get(key,function(err,value){
		if (err) {
			// if not create a new one
			value=rec
			value.temp.cnt=1
			value.humid.cnt=1
			value.date=timestamp
			}
		else{
			// update the current record
			setMinMaxAvg(value.temp,rec.temp)
			setMinMaxAvg(value.humid,rec.humid)
		}
		// save record
		db.put(key,value);
		// trigger the update of the next level (should be automagically, but sublevel does not emit events like leveldb
		db.emit('put',key,value);
	})
}

// update hour db when data is inserted into raw data
rddb.on('put',function(key,value){
	//console.log('on rddb fired', key)
	// rewrite record in a form suitable for aggregation
	var record={
		temp:{
			min: value.temp,
			max: value.temp,
			avg: value.temp
		},
		humid:{
			min: value.humid,
			max: value.humid,
			avg: value.humid
		},
		sensor: value.id,
		date: value.date
	}
	// round the date
	var key=new Date(record.date)
	key.setMinutes(0)
	key.setSeconds(0)
	key.setMilliseconds(0)
	//console.log('hour', key)
	updateInterval(hrdb,key,record)
	})
	
// update day db when data is inserted into hour db
hrdb.on('put',function(key,rec){
	//console.log('on hrdb fired', key)
	// round the date
	var key=new Date(rec.date)
	key.setUTCHours(0)
	//console.log('day', key)
	updateInterval(daydb,key,rec)
	})
	
// update month db when data is inserted into day db
daydb.on('put',function(key,rec){
	//console.log('on daydb fired', key)
	// round the date
	var key=new Date(rec.date)
	key.setUTCDate(1)
	//console.log('month', key,rec)
	updateInterval(monthdb,key,rec)
	})
	
var dbname = __dirname + '\\weatherDB'
var srcdb = LevelUp(dbname,{ valueEncoding: 'json' })
var start=new Date()
start.setUTCDate(1)
//start.setUTCMonth(2)
//var query={ 'start' : start.toJSON()}
var query={}
srcdb.createReadStream(query)
		.on('data', function (data) {
			//console.log('rddb',data.key)
			rddb.put(data.key,data.value)
			rddb.emit('put',data.key,data.value)
		})
		

	
