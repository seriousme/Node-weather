import { openDB } from "../lib/database.js";

const weatherdb = openDB();

// const sensors={
// 'F8':{ name:'Buiten' },
// '6C':{ name:'Kas' }
// }

const sindex = {};
const minCount = 5; // need at least 5 valid measurements


const configRec = await weatherdb.get("config/sensorIDs")
// console.log(configRec)
const sensors = configRec.sensorIDs;
// create an index
for (const key in sensors) {
	sindex[sensors[key].name] = sensors[key];
}
// console.log("before",JSON.stringify(sensors))
// console.log("index",JSON.stringify(sindex))
const body = await weatherdb.view(
	"data",
	"unknownSensors",
	{ reduce: true, group_level: 2 }
);
if (body.rows.length === 1) {
	const newConfigRec = {
		sensorIDs: {}
	};
	const sIDs = newConfigRec.sensorIDs;
	const sensorId = body.rows[0].key[0];
	const sensor = body.rows[0].value;
	console.log(`Sensor ${sensorId} : aantal metingen ${sensor.count} minumum: ${sensor.min} maximum: ${sensor.max}`);
	sIDs[sensorId] = sindex.Buiten;
	if (sensor.count > minCount) {
		console.log("Sensor", sensorId, "wordt", sIDs[sensorId].name);
		// console.log("after",JSON.stringify(newConfigRec))
		await weatherdb.insert(newConfigRec)
	} else {
		console.log(`Te weinig metingen: ${sensor.count} < ${minCount}`)
	}
} else {
	const len = body.rows.length;
	console.log(`err: aantal sensors = ${len}`);
	if (len) {
		console.log(JSON.stringify(body.rows));
	}
}

