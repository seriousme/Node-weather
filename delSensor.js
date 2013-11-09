var levelup=require('level');
var dbname= __dirname + '/weatherDB';
var db = levelup(dbname,{ valueEncoding: 'json' });
console.log("using database: ",dbname); 



//db.createReadStream({end:2014,limit:2})
db.createReadStream()
    .on('data', function (data) {
		if (data.value.id == 'E4'){
			console.log('Deleting ',data.key);
			db.del(data.key);
			}
    });