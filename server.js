


var host = 'localhost';
var port = 80;

require ('./jsonDateParse');
var rs=require ('./readSerial');

var levelup=require('level');
var db = levelup('weatherDB',{ valueEncoding: 'json' });
rs.startSerial(db);

var ranges={
	now:{ adjust:function (d){ d.setHours(d.getHours()-12); },
		  inRange:function(d1,d2) { return true}
		},
	day:{ adjust:function (d){ d.setDate(d.getDate()-1); },
		  inRange:function(d1,d2) { return (d1.getHours()==d2.getHours())}
		},
	week:{ adjust:function (d){ d.setDate(d.getDate()-7);},
		   inRange:function(d1,d2) { return (d1.getDay()==d2.getDay())}
		},
	month:{ adjust:function (d){ d.setMonth(d.getMonth()-1); },
		  inRange:function(d1,d2) { return (d1.getDay()==d2.getDay())}
		},
	year:{ adjust:function (d){ d.setFullYear(d.getFullYear()-1);},
		  inRange:function(d1,d2) { return (d1.getMonth()==d2.getMonth())}
		},
};

function setMax(a,i,b){
	b=Number(b); //explicit cast to avoid accidents
	if (typeof(a[i]) == 'undefined')
		a[i]=b;
	else
		if (b > a[i])
			a[i]=b;
}

function setMin(a,i,b){
	b=Number(b); //explicit cast to avoid accidents
	if (typeof(a[i]) == 'undefined')
		a[i]=b;
	else
		if (b < a[i])
			a[i]=b;
}

function setAvg(a,c,i,b){
	b=Number(b); //explicit cast to avoid accidents
	if (typeof(a[c]) == 'undefined'){
		a[c]=1;
		a[i]=b;
	}
	else{
		a[i]=(a[c]*a[i]+b)/++a[c];
	}
}

function setMinMax(result,data){
	setMax(result.temp,'max',data.temp);
	setMin(result.temp,'min',data.temp);
	setMax(result.humid,'max',data.humid);
	setMin(result.humid,'min',data.humid);
	setAvg(result.temp,'points','avg',data.temp);
	setAvg(result.humid,'points','avg',data.humid);
}


function processRecordNow(item,data){
	if (typeof item.temp=='undefined'){
		item.temp={};
		item.humid={};
	}
	setMinMax(item,data);
	item.batt=data.batt;
	item.at=data.date;
	item.temp.current=data.temp;
	item.humid.current=data.humid;
}


function endInterval(result){
	for (id in result){
		if (result[id].interval){
			result[id].datapoints.push(result[id].interval);
			delete result[id].interval;
			delete result[id].lastDate;
		}
	}
}

function processRecordInterval(item,data,range){
	var id=data.id;
	if (typeof(item.datapoints) == 'undefined'){
		item.datapoints= [];
		item.temp={};
		item.humid={};
	}
	
	if (typeof(item.interval) == 'undefined'){
		item.interval={
			temp:{},
			humid:{}
		};
		item.lastDate= data.date;
	}
	else{
		if (! ranges[range].inRange(item.lastDate,data.date)){
			item.interval.at=data.date;
			item.datapoints.push(item.interval);
			item.interval={
				temp:{},
				humid:{}
			};
			item.lastDate= data.date;
		}
	}
	
	 // overall min/max
	setMinMax(item,data);
	// interval min/max
	setMinMax(item.interval,data);
}




function processRecord(items,data,range){
	if (! items[data.id])
		items[data.id]={ id: data.id };
	if (range=='now')
		processRecordNow(items[data.id],data);
	else {
		processRecordInterval(items[data.id],data,range);
	}
}


function adjustJsonDate(query){
	var d={};
	if (! ranges[query.range])
		query.range='now';
	if (query.end)
		d=JSON.parse(query.end);
	console.log('parsed date',d);
	if (typeof(d.date)!='object')
		d=new Date();
	ranges[query.range].adjust(d);
	
	query.start=d.toJSON();
}

function send(req, res, next){
	var result={};
	var query=req.params;
	adjustJsonDate(query);
	//db.createReadStream({end:2014,limit:2})
	db.createReadStream(query)
		.on('data', function (data) {
			processRecord(result,data.value,query.range);
		})
		.on('end', function (){
			// save the last interval
			endInterval(result);
			res.end(JSON.stringify(result));
		});
	return next();
}

var restify = require('restify');
var server = restify.createServer();

server.use(restify.queryParser());
server.get('/weather',send );
server.get('/weather/:range',send );
// this one needs to be last
server.get('/.*',restify.serveStatic({
  directory: './public',
  default:'index.html'
}));
    



server.listen(port,host);
console.log('Server is running at','http://'+host+':'+port);





