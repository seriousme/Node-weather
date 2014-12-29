var levelup=require('level');
var dbname= __dirname + '/weatherDB';
var db = levelup(dbname,{ valueEncoding: 'json' });
console.log("using database: ",dbname); 
var nano = require('nano')('http://localhost:5984');
var weatherdb = nano.use('weatherdb');

var sensors={
        'F8':{ name:'Buiten' },
        '6C':{ name:'Kas' }
};

var batch=db.batch()
var cnt=0
// {"id":"2014-05-29T15:03:58.364Z","key":"2014-05-29T15:03:58.364Z","value":{"rev":"1-6eeccd657ead1478490be1fe23ffd526"}},
//{"id":"2014-03-07T17:17:03.599Z","key":"2014-03-07T17:17:03.599Z","value":{"rev":"1-213f53d82f5f406056fa079f033f6e65"}},

//db.createReadStream({end:2014,limit:2})
db.createReadStream({start:'2014-03-02',end:'2014-05-29T15:03'})
    .on('data', function (data) {
	weatherdb.insert(data.value, data.key, function(err, body, header) {
			  if (err) {
				console.log('[weatherdb.insert] ', err.message);
				return;
			  }
			  cnt++
			  //console.log('you have inserted')
			  //console.log(body);
			});
				})
   .on('end',function(){
		console.log('Inserted', cnt, 'records')
}
);
