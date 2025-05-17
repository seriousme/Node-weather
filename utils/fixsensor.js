import { openDB } from "../lib/database.js";
const weatherdb = openDB();

const bulk = {
	docs: [],
};

// let sensors={
// 'F8':{ name:'Buiten' },
// '6C':{ name:'Kas' }
// }

function bulkUpdate() {
	weatherdb.bulk(bulk, (err, body) => {
		if (!err) {
			console.log("update complete");
		} else {
			console.log(err, body);
		}
	});
}

function doProcess(sensors) {
	return function processRecords(err, body) {
		if (!err) {
			console.log("rows to analyse:", body.total_rows);
			for (const row of body.rows) {
				if (sensors[row.doc.sensorid]) {
					row.doc.id = sensors[row.doc.sensorid].name;
					bulk.docs.push(row.doc);
				}
			}
			console.log("rows to fix:", bulk.docs.length);
			if (process.argv[2] === "-force") {
				bulkUpdate();
			} else {
				console.log("use: -force to update records");
				// console.log(JSON.stringify(bulk.docs,null," "))
			}
		} else {
			console.log("error getting view:", err.reason);
		}
	};
}

weatherdb.get("config/sensorIDs", (err, body) => {
	if (!err) {
		const sensors = body.sensorIDs;
		console.log("fetched sensorID's");
		weatherdb.view(
			"data",
			"unknownSensors",
			{
				reduce: false,
				include_docs: true,
			},
			doProcess(sensors),
		);
	} else {
		console.log("err:", err.reason);
	}
});
