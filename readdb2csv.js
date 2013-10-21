var levelup=require('level');
var db = levelup('weatherDB',{ valueEncoding: 'json'});
var items={};

//db.createReadStream({end:2014,limit:2})
db.createReadStream()
    .on('data', function (data) {
		//console.log(data.value);
	  items[data.value.id]={data.value.date=data.value.temp};
    });
	
console.log(items);