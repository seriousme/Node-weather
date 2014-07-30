// acquire weather data from 868 weather sensors using the IT+ protocol via a JeeLink and store it in CouchDB

     
// log once every five minutes
var timeInterval=5000*60*1;
var config=require("./config.json");
     
var nano = require('nano')(config.writer)
var weatherdb = nano.use('weatherdb');

var com = require("serialport");
var comPort='/dev/ttyUSB0';
//var comPort='COM5';

var sensors={};

// var sensors={ 
	// 'F8':{ name:'Buiten' },
	// '6C':{ name:'Kas' }
// };

function updateSensors(init){
	weatherdb.get('config/sensorIDs', function(err, body) {
	  if (!err)
		sensors=body.sensorIDs;
		console.log(sensors);
		var nowTime=new Date().getTime();
		sensors.nextTime=nowTime+timeInterval;
		if (init){
			startSerial();
		}
	});
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
		  var nowTime=now.getTime();
		  
		  //console.log(datestr,msg);
		  // IT+ ID: F0 Temp: 14.8 Humidity: 84 RawData: 9F 05 48
		  var data=msg.split(' ');
		  if (data[0]==='IT+')  {
			var id=data[2];
			var name=id;
			if (typeof(sensors[id])=='undefined'){
				sensors[id]={};
			}
			else{
				name=sensors[id].name;
			}
			if (typeof(sensors[id].nextTime)=='undefined'){
				sensors[id].nextTime=0;
			}
			
			if (nowTime >= sensors[id].nextTime){
				var datestr=now.toJSON();
		  		console.log(datestr,msg);
				if (data[7] != 'L')
					data[7]='ok';
				var record={ date: datestr,
				   id: name,
				   sensorid: id,
				   temp: Number(data[4]) ,
				   humid: Number(data[6]),
				   batt: data[7],
				   msg: msg
				};
				sensors[id].nextTime=nowTime+timeInterval;
				weatherdb.insert(record, datestr, function(err, body, header) {
			  		if (err) {
						console.log('[weatherdb.insert] ', err.message);
						return;
			  		}
			  		//console.log('you have inserted')
			  		//console.log(body);
				});
			}
		  }
		  // try to update the sensor ID's in the same interval
		if (nowTime >= sensors.nextTime){
			updateSensors(false);
		}
			
		});
	};
	
	updateSensors(true);







