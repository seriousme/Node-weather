var levelup=require('level');
var db = levelup(__dirname+'/weatherDB',{ valueEncoding: 'json' });

//db.createReadStream({start:'2014-03-21' ,end:2014,limit:2})
//{"date":"2013-11-05T21:09:37.954Z","id":"Kas","sensorid":"4C","temp":8.8,"humid":93,"batt":"L","msg":"IT+ ID: 4C Temp: 8.8 Humidity: 93 L RawData: 94 C4 88"}
db.createReadStream( {end:2014,limit:2})
    .on('data', function (data) {
      console.log(data.value)
    });
