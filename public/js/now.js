var sensorData={}, ractive;
var sensorIds=[];
var currentSensor;
var currentType='temp';
var defaultSensor='Buiten2';
var sensorTypes={temp:0,humid:1};
//var dbUrl= 'http://'+location.hostname+':5984/weatherdb/_design/data/_view/byhour';
var dbUrl= 'http://raspiw:5984/weatherdb/_design/data/_view/byhour';


var promises = {};
window.getJSON = function ( url ) {
	if ( !promises[ url ] ) {
		promises[ url ] = new Ractive.Promise( function ( fulfil ) {
			var xhr = new XMLHttpRequest();
			xhr.onload = function () {
				fulfil( JSON.parse( xhr.responseText ) );
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
			
			sensorData[id][type].min= min;
			sensorData[id][type].max= max;
			sensorData[id][type].avg= avg;
			if (( id == currentSensor) && (type== currentType)){
				ractive.set( { data: sensorData[ currentSensor ][currentType] });
			}
			
	});
	// and the exact last one
	query=dbUrl+'?reduce=false&descending=true&limit=1&startkey='+ JSON.stringify(endparams);
	$.getJSON(query).then( function ( data ) {
			if (data.rows.length > 0) {
				sensorData[id][type].current=data.rows[0].value;
				sensorData[id][type].lastUpdate=data.rows[0].id;
				if (( id == currentSensor) && (type== currentType)){
					ractive.set( { data: sensorData[ currentSensor ][currentType] });
				}
			}
			
	});

}
	

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
  }
});

function updateData(){
	$.getJSON(dbUrl+ '?group_level=1' ).then( function ( data ) {
		for (var idx in data.rows){
			var row= data.rows[idx]
			var id= row.key[0]
			if (typeof(sensorData[id])=='undefined'){
				sensorIds.push({name:id});
				sensorData[id]={};
			}
			for (var type in sensorTypes){
				sensorData[id][type]={};
				getCurrentSensorData(id,type);
			}
		}
		if (typeof(currentSensor)=='undefined'){
			if (typeof(sensorData[defaultSensor])!='undefined'){
				currentSensor=defaultSensor;
			}
			else{
				currentSensor=Object.keys(sensorData)[0];
			}
		}
		

		ractive.set({
			sensors: sensorIds,
			selected: currentSensor
		});
	});
}



// when the user makes a selection from the drop-down, update the chart
ractive.observe( 'selected', function ( value ) {
	currentSensor=value;
	if (typeof(sensorData[currentSensor])!='undefined'){
		this.set( { 
			data: sensorData[ currentSensor ][currentType]
		});
	}
});

ractive.observe( 'sensorType', function ( value) {
	currentType=value;
	if (typeof(sensorData[currentSensor])!='undefined'){
		this.set( { 
			data: sensorData[ currentSensor ][currentType]
		});
	}
});

// load our data
updateData();
// and again after 2 mins
setInterval(function(){ updateData() }, 120000);




