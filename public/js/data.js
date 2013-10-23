// load our data
$.getJSON( '/weather' ).then( function ( sensordata) {

	var ractive1 = new Ractive({
				el: 'container1',
				template: '#myTemplate',
				data: sensordata.F0
			});
	var ractive2 = new Ractive({
				el: 'container2',
				template: '#myTemplate',
				data: sensordata.A4
			});
});