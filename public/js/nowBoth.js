var sensorData={}, ractive;
var sensorIds=[];
var currentSensor;
var currentType='temp';
var defaultSensor='Buiten';
var sensorTypes={temp:0,humid:1};
//var dbUrl= 'http://'+location.hostname+':5984/weatherdb/_design/data/_view/byhour';
var dbUrl= 'http://raspiw:5984/weatherdb/_design/data/_view/byhour';

// provide our own getJSON to avoid needing jQuery
var promises = {};
function getJSON ( url ) {
	if ( !promises[ url ] ) {
		promises[ url ] = new Ractive.Promise( function ( fulfil ) {
			var xhr = new XMLHttpRequest();
			xhr.onload = function () {
				fulfil( JSON.parse( xhr.responseText ) );
				// do not cache results
				delete ( promises[ url ] )
				};
			xhr.open( 'GET', url );
			xhr.send();
		});
	}
	return promises[ url ];
};


	
function getCurrentSensorData(id,type){
	//var d=new Date(2014,6,20,16);
	var d=new Date();
	d.setHours(d.getHours()-12);
	var startparams=[id, type, d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getUTCHours()];
	var endparams=[id, type,{}];
	
	// get the average
	var query=dbUrl+'?group_level=6&startkey='+ JSON.stringify(startparams)+'&endkey='+JSON.stringify(endparams);
		
	getJSON(query).then( function ( data ) {
			var min= Infinity
			var max= -Infinity
			var sum=0
			var count=0
			var current=0
			for (var idx in data.rows){
				var row= data.rows[idx]
				if (row.value.min < min)
					min= row.value.min
				if (row.value.max > max)
					max= row.value.max
				sum += row.value.sum
				count += row.value.count
			}
			var avg= sum/count;
			sensorData[type][id].name= id;
			sensorData[type][id].min= min;
			sensorData[type][id].max= max;
			sensorData[type][id].avg= avg;
			if	(type == currentType)	
			ractive.set({
					data: sensorData[currentType]
				});	
			else
				ractive.update()
	});
	// and the exact last one
	query=dbUrl+'?reduce=false&descending=true&limit=1&startkey='+ JSON.stringify(endparams);
	getJSON(query).then( function ( data ) {
			if (data.rows.length > 0) {
				sensorData[type][id].current=data.rows[0].value;
				sensorData[type][id].lastUpdate=data.rows[0].id;
				ractive.update()
			}
			
	});

}
	



function updateData(){
	getJSON(dbUrl+ '?group_level=1' ).then( function ( data ) {
		
				
		for (var type in sensorTypes){	
			if (typeof(sensorData[type])=='undefined'){
					sensorData[type]={};
				}
			for (var idx in data.rows){
				var row= data.rows[idx]
				var id= row.key[0]
				
				
				if (typeof(sensorData[type][id])=='undefined'){
					sensorIds.push({name:id});
					sensorData[type][id]={};
				}
				getCurrentSensorData(id,type);
				
			}
		}
		if (typeof(currentSensor)=='undefined'){
			if (typeof(sensorData[currentType][defaultSensor])!='undefined'){
				currentSensor=defaultSensor;
			}
			else{
				currentSensor=Object.keys(sensorData[currentType])[0];
			}
		}
		

		
	});
}

// initialize ractive
ractive = new Ractive({
  el: output,
  template: '#template',
  data: {
    format: function ( val, valueType ) {
	  if (typeof(val) != 'undefined')
		val=Number(val);
      if ( valueType === 'temp' ) 
        return val.toFixed( 1 ) + '°';
	  else
		return val.toFixed( 1 ) + '%';
    },
	datefmt: function (val){
		if (typeof(val) != 'undefined'){
			var d=new Date(val);
			return (d.toLocaleString());
		}
	}
  }
});


// when the user makes a selection from the drop-down, update the data

ractive.observe( 'sensorType', function ( value) {
	currentType=value;
	if (typeof(sensorData[currentType])!='undefined'){
		this.set( { 
			data: sensorData[currentType]
		});
	}
});

// load our data
updateData();
// and again after 2 mins
setInterval(function(){ updateData() }, 120000);




