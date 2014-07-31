// acquire weather data from 868 weather sensors using the IT+ protocol via a JeeLink and store it in CouchDB

     
// log once every five minutes
var timeInterval=5000*60*1;
// expire unnamed sensors we haven't seen for an hour
var expireInterval=60000*60*1;

var config=require("./config.json");
     
var nano = require('nano')(config.writer)
var weatherdb = nano.use('weatherdb');

var com = require("serialport");
var comPort='/dev/ttyUSB0';
//var comPort='COM5';

var sensors={};
var settings={};

// var sensors={ 
	// 'F8':{ name:'Buiten' },
	// '6C':{ name:'Kas' }
// };

function updateSensors(init){
	weatherdb.get('config/sensorIDs', function(err, body) {
	  if (!err){
		var nowTime=new Date().getTime();
		if (settings._rev != body._rev){
			sensors=body.sensorIDs;
			settings._rev = body._rev;
			console.log(settings,sensors);
		}
		else{
			for (id in sensors){
				if (typeof(sensors[id].lastSeen) != 'undefined'){
					if ((nowTime-sensors[id].lastSeen) > expireInterval){
						delete sensors[id];
					}
				}
			}
		}
				
		settings.nextTime=nowTime+timeInterval;
		if (init){
			startSerial();
		}
	  }
	});
}


function checkOutlier(data,x,maxDistance){
	if (data.length < 3) return false; // need at least 3 values
	var total=0;
	for(var i in data) { 
		total += data[i]; 
	}
	var avg=total/data.length;
	//console.log(data,avg,x,maxDistance);
	
	// weed out the extremes
	var total=0;
	for(var i in data) { 
		if (Math.abs(data[i]-avg) > maxDistance){
			//console.log("outlier",data[i]);
			data.splice(i,1);
		}
		else{
			total +=data[i]; 
		}
	}
	avg=total/data.length;
	if (Math.abs(x-avg) > maxDistance){
		//console.log(data,avg,x,maxDistance);
		return(false);
	}
	// everything ok, wait for new data to accumulate
	data.splice(0,data.length);
	return true;
}
	
	
function valuesOk(sensor,temp,humid){
	return( checkOutlier(sensor.temps,temp,5) &&
		checkOutlier(sensor.humids,humid,20));
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
		  var datestr=now.toJSON();
		  //console.log(datestr,msg);
		  // IT+ ID: F0 Temp: 14.8 Humidity: 84 RawData: 9F 05 48
		  var data=msg.split(' ');
		  if (data[0]==='IT+')  {
			var id=data[2];
			var name=id;
			var temp=Number(data[4]);
			var humid=Number(data[6]);
			var batt=data[7];
			if (batt != 'L')
						batt='ok';
			if (typeof(sensors[id])=='undefined'){
				// for new unknown sensors we want to see them at least twice to 
				// avoid garbled reception to enter the database
				sensors[id]={};
				sensors[id].nextTime=nowTime+1;
				sensors[id].temps=[];
				sensors[id].humids=[];
			}
			else{
				// known sensor
				name=sensors[id].name;
				if (typeof(sensors[id].nextTime)=='undefined'){
					sensors[id].nextTime=0;
					sensors[id].temps=[];
					sensors[id].humids=[];
				}
			}	
			// retain the values in cache to look for outliers
			sensors[id].temps.push(temp);
			sensors[id].humids.push(humid);
			sensors[id].lastSeen=nowTime;
			

			if (nowTime >= sensors[id].nextTime){
				if (valuesOk(sensors[id],temp,humid)){
					console.log(datestr,msg);
					var record={ date: datestr,
					   id: name,
					   sensorid: id,
					   temp: temp ,
					   humid: humid,
					   batt: batt,
					   msg: msg
					};
					weatherdb.insert(record, datestr, function(err, body, header) {
						if (err) {
							console.log('[weatherdb.insert] ', err.message);
							return;
						}
						//console.log('you have inserted')
						//console.log(body);
					});
					// and update the interval
					sensors[id].nextTime=nowTime+timeInterval;
				}
			}
		}
		// try to update the sensor ID's in the same interval
		if (nowTime >= settings.nextTime){
			updateSensors(false);
		}			
		});
	};
	
	updateSensors(true);







