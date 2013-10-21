// acquire weather data from 868 weather sensors using the IT+ protocol via a JeeLink
          
var com = require("serialport");
var levelup=require('level');
var db = levelup('weatherDB',{ valueEncoding: 'json' });
var comPort='/dev/ttyUSB0';
//var comPort='COM5';

var items={};
// log once every five minutes
var timeInterval=5000*60*1;

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

function startSerial(){
	var serialPort = new com.SerialPort(comPort, {
		baudrate: 57600,
		parser: com.parsers.readline('\r\n')
	});

	serialPort.on('open',function() {
	//console.log('Port open');
	});

	serialPort.on('data', function(msg) {
	  var now=new Date();
	  var newTime=now.getTime();
	  var datestr=now.toJSON();
	  console.log(datestr,msg);
	  // IT+ ID: F0 Temp: 14.8 Humidity: 84 RawData: 9F 05 48
	  var data=msg.split(' ');
	  if (data[0]==='IT+')  {
		var id=data[2];
		console.log("id",id);
		if (! items[id]){
			items[id]={ nextTime: 0};
		}
		if (newTime >= items[id].nextTime){
			items[id]={ date: datestr,
			   id: id,
			   temp: data[4],
			   humid: data[6],
			   batt: data[7],
			   msg: msg,
			   nextTime: newTime+timeInterval
			};
			// Todo: if day changed, reset max/min
			setMax(items[id],'maxTemp',items[id].temp);
			setMax(items[id],'maxHumid',items[id].humid);
			setMin(items[id],'minTemp',items[id].temp);
			setMin(items[id],'minHumid',items[id].humid);
			db.put(items[id].date,items[id]);
		}
	  }
	});
}

startSerial();

