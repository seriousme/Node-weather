import { openDB } from "../lib/database.js";
const weatherdb = openDB();

// const sensors={
// 'F8':{ name:'Buiten' },
// '6C':{ name:'Kas' }
// }
const newSensors = {};
const sindex = {};
const configRec = {};
const minCount = 5; // need at least 5 valid measurements

function processSensorData(err, body) {
	if (!err) {
		if (body.rows.length === 2) {
			const sensor0id = body.rows[0].key[0];
			const sensor1id = body.rows[1].key[0];
			const sensor0 = body.rows[0].value;
			const sensor1 = body.rows[1].value;
			let found = false;
			console.log(
				"Sensor",
				sensor0id,
				": aantal metingen",
				sensor0.count,
				"minumum",
				sensor0.min,
				" maximum",
				sensor0.max,
			);
			console.log(
				"Sensor",
				sensor1id,
				": aantal metingen",
				sensor1.count,
				"minumum",
				sensor1.min,
				" maximum",
				sensor1.max,
			);
			if (sensor0.max > sensor1.max && sensor0.min > sensor1.min) {
				// sensor0='Kas'
				found = true;
				newSensors[sensor0id] = sindex.Kas;
				newSensors[sensor1id] = sindex.Buiten;
			}
			if (sensor0.max < sensor1.max && sensor0.min < sensor1.min) {
				// sensor1='Kas'
				found = true;
				newSensors[sensor1id] = sindex.Kas;
				newSensors[sensor0id] = sindex.Buiten;
			}
			if (sensor0.count <= minCount || sensor1.count <= minCount) {
				found = false;
			}
			if (found) {
				console.log("Sensor", sensor0id, "wordt", newSensors[sensor0id].name);
				console.log("Sensor", sensor1id, "wordt", newSensors[sensor1id].name);
				// console.log("after",JSON.stringify(newSensors))
				configRec.sensorIDs = newSensors;
				// console.log(configBody)
				weatherdb.insert(configRec, (err, body) => {
					if (err) console.log("err: config update failed", err);
				});
			} else {
				console.log(
					"Niet genoeg informatie om te bepalen welke sensor waar zit, probeer het later nogmaals",
				);
			}
		} else {
			console.log("err: number of sensors =", body.rows.length);
			console.log(JSON.stringify(body.rows));
		}
	} else {
		console.log("err:", err.reason);
	}
}

weatherdb.get("config/sensorIDs", (err, body) => {
	if (!err) {
		// console.log(body)
		const configRec = body;
		const sensors = configRec.sensorIDs;
		// create an index
		for (const key in sensors) {
			sindex[sensors[key].name] = sensors[key];
		}
		// console.log("before",JSON.stringify(sensors))
		// console.log("index",JSON.stringify(sindex))
		weatherdb.view(
			"data",
			"unknownSensors",
			{ reduce: true, group_level: 2 },
			processSensorData,
		);
	} else {
		console.log("err:", err.reason);
	}
});
