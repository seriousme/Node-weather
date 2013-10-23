
var levelup=require('level');
var db = levelup('weatherDB',{ valueEncoding: 'json' });

function setMax(a,i,b){
	if (typeof a[i] == 'undefined')
		a[i]=b;
	else
		if (b > a[i])
			a[i]=b;
}

function setMin(a,i,b){
	if (typeof a[i] == 'undefined')
		a[i]=b;
	else
		if (b < a[i])
			a[i]=b;
}
//db.createReadStream({end:2014,limit:2})

function processRecord(items,data){
	console.log(data);
	var id=data.id;
	if (! items[id]){
	items[id]={
		id: id,
		temp:{},
		humid:{},
		datapoints: []
		};
	}

	setMax(items[id].temp,'max',data.temp);
	setMin(items[id].temp,'min',data.temp);
	setMax(items[id].humid,'max',data.humid);
	setMin(items[id].humid,'min',data.humid);
	items[id].batt=data.batt;
	items[id].at=data.date;
	items[id].temp.current=data.temp;
	items[id].humid.current=data.humid;
	items[id].datapoints.push({
		temp: data.temp,
		humid: data.humid,
		at:data.date
	});

}

function getData(query,cb){
	var result={};
	db.createReadStream(query)
		.on('data', function (data) {
			processRecord(result,data.value);
		})
		.on('end', function (){
			cb(result);
		});
}

var connect = require('connect');
var http = require('http');


var app = connect()
  .use(connect.logger('dev'))
  .use(connect.static('public'))
  .use(connect.query())
  .use('/weather',function(req, res){
    getData(req.query,function(data){ res.end(JSON.stringify(data))});
   })
  .use(function(req, res){
    res.writeHead(404, {'content-type':'text/plain'});
    res.end('404: Page not found\n');
  });


var host = 'localhost';
var port = 80;

// required for c9.io testing compatibility
if (process.env.C9_PID)
{
    host=process.env.IP;
    port=process.env.PORT;
}
else
    console.log('Server is running at','http://'+host+':'+port);

http.createServer(app).listen(port,host);





