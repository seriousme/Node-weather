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

// provide a method to pickup QueryString values
function getQueryStringValue (key) {  
  return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
}  

// load our data
function getDaySensorData(id,type){
	var endDate,endParams;
	var lastRecord=[id, type,{}]
	
	// check for a query date e.g: http://localhost:8080/interval.html?date=2014-11-11
	var datestr=getQueryStringValue("date")
	if (datestr != "") {
		endDate=new Date(datestr)
		startDate=new Date(endDate)
		sensorData[id][type].date=endDate.toLocaleDateString()
		// get end of day
		endDate.setDate(endDate.getDate()+1)
		endDate.setMinutes(endDate.getMinutes()-1)
		endParams=[id, type, endDate.getUTCFullYear(),endDate.getUTCMonth()+1,endDate.getUTCDate(),endDate.getUTCHours()]
		
	}
	else {
		startDate=new Date();
		// go back 1 day
		startDate.setDate(startDate.getDate()-1)
		endParams=lastRecord;
	}
	
	// compensate for month starting at 0
	var startParams=[id, type, startDate.getUTCFullYear(),startDate.getUTCMonth()+1,startDate.getUTCDate(),startDate.getUTCHours()];
	
	// get the hourly data
	var query=dbUrl+'?group_level=6&startkey='+ JSON.stringify(startParams)+'&endkey='+JSON.stringify(endParams);
	getJSON(query).then( function ( data ) {
			
			sensorData[id][type].day={ items:[],labels:[]};
			var items=sensorData[id][type].day.items;
			var labels=sensorData[id][type].day.labels;
			for (var idx in data.rows){
				var row= data.rows[idx];
				// compensate for month starting at 0
				var d=  new Date(Date.UTC(row.key[2],row.key[3]-1,row.key[4],row.key[5]));
				labels.push(d.getHours())
				// calculate average
				var avg= row.value.sum/row.value.count;
				avg=Number(avg.toFixed( 1 ));
				items.push({
					avg: avg,
					min: row.value.min,
					max: row.value.max,
					date: d.toJSON()
				});
				
			}
			ractive.update();
			
	});
	// and the exact last one
	query=dbUrl+'?reduce=false&descending=true&limit=1&startkey='+ JSON.stringify(lastRecord);
	getJSON(query).then( function ( data ) {
			if (data.rows.length > 0) {
				sensorData[id][type].lastUpdate=data.rows[0].id;
				ractive.update();
			}	
	});
}

function updateData(){
	getJSON(dbUrl+ '?group_level=1' ).then( function ( data ) {
		for (var idx in data.rows){
			var row= data.rows[idx]
			var id= row.key[0]
			if (typeof(sensorData[id])=='undefined'){
				sensorIds.push({name:id});
				sensorData[id]={};
			}
			for (var type in sensorTypes){
				sensorData[id][type]={};
				getDaySensorData(id,type);
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
///////////////////////
ractive = new Ractive({
  el: output,
  template: '#template',
  data: {
    scale: function ( val,valueType ) {
	// quick and dirty...
	  if ( valueType === 'temp' ) 
        return 2 * Math.abs( val );
	  else
		return Math.abs(val/2);
    },
    format: function ( val, valueType ) {
	
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
	},
    getColor: function ( val ) {
      // quick and dirty function to pick a colour - the higher the
      // temperature, the warmer the colour
      var r = Math.max( 0, Math.min( 255, Math.floor( 2.56 * ( val + 50 ) ) ) );
      var g = 100;
      var b = Math.max( 0, Math.min( 255, Math.floor( 2.56 * ( 50 - val ) ) ) );

      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
  }
});

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

updateData();

