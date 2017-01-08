const config = require("./config.json");
const nano = require('nano')(config.writer);
const weatherdb = nano.use('weatherdb');

const bulk = {
	docs : []
};

var sensors={};
// var sensors={ 
	// 'F8':{ name:'Buiten' },
	// '6C':{ name:'Kas' }
// };


function bulkUpdate() {
	weatherdb.bulk( bulk, function (err, body) {
		if (!err){
			console.log("update complete");
		}
		else{
			console.log(err, body);
		}
	});
}

function processRecords(err, body){
		if (!err) {
			console.log("rows to analyse:", body.total_rows);
			body.rows.forEach(function (row) {
				if (sensors[row.doc.sensorid]){
					row.doc.id= sensors[row.doc.sensorid].name;
					bulk.docs.push(row.doc);
				}
			});
			console.log("rows to fix:", bulk.docs.length);
			if (process.argv[2] == "-force") {
				bulkUpdate();
			} else {
				console.log("use: -force to update records");
				//console.log(JSON.stringify(bulk.docs,null," "));
			}
		} else {
			console.log("error getting view:", err.reason);
		}
	}

weatherdb.get('config/sensorIDs', function(err, body) {
	if (!err){
		sensors=body.sensorIDs;
		console.log("fetched sensorID's");
		weatherdb.view('data', 'unknownSensors', {
			"reduce" : false,
			"include_docs" : true
		},processRecords );
	} else {
		console.log("err:", err.reason);
	}
});
