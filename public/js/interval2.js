var sensors={}, ractive;
var sensorIds=[];
var currentSensor;
var sensorType='temp';


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
  this.set( { 
	selectedRange: sensors[ currentSensor ][sensorType],
	labels: sensors[currentSensor].labels
	});
});

ractive.observe( 'sensorType', function ( value) {
  sensorType=value;
  this.set( { 
	selectedRange: sensors[ currentSensor ][sensorType],
	labels: sensors[currentSensor].labels
	});
});

// load our data
$.getJSON( '/weather/month' ).then( function ( data ) {
	for (id in data){
		sensorIds.push({name:id});
		if (typeof(currentSensor)=='undefined')
			currentSensor=id;
		if (id=='Buiten')	// pref for this sensor
			currentSensor=id;
		var record={
			temp:{items:[]},
			humid:{items:[]},
			labels:[]
		};
		for (var i=0;i<data[id].datapoints.length;i++){
			record.temp.items.push(data[id].datapoints[i].temp);
			record.humid.items.push(data[id].datapoints[i].humid);
			var d=new Date(data[id].datapoints[i].at);
			record.labels.push(d.getDate()); //this one needs to become more flexible
		}
		sensors[id]=record;
	}

	ractive.set({
		sensors: sensorIds,
		selected: currentSensor
	});
});