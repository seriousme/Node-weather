var levelup=require('level');
var db = levelup('weatherDB');

//db.createReadStream({end:2014,limit:2})
db.createReadStream()
    .on('data', function (data) {
      console.log(data.value)
    });