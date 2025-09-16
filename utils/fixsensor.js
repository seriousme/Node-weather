import { openDB } from "../lib/database.js";

const weatherdb = openDB();

// let sensors={
// 'F8':{ name:'Buiten' },
// '6C':{ name:'Kas' }
// }

try {
	const { values, positionals } = parseArgs({ options, allowPositionals: true })
	const force = values.force;
	const sensor = positionals[0];
	if (!sensor) {
		throw (new Error("missing argument 'sensor'"));
	}

	const body = weatherdb.get("config/sensorIDs")
	const sensors = body.sensorIDs;
	console.log("fetched sensorID's");
	const unknown = weatherdb.view(
		"data",
		"unknownSensors",
		{
			reduce: false,
			include_docs: true,
		});
	console.log("rows to analyse:", unknown.total_rows);
	const bulk = {
		docs: [],
	};
	for (const row of unknown.rows) {
		if (sensors[row.doc.sensorid]) {
			row.doc.id = sensors[row.doc.sensorid].name;
			bulk.docs.push(row.doc);
		}
	}
	console.log("rows to fix:", bulk.docs.length);
	if (force) {
		await weatherdb.bulk(bulk)
		console.log("update complete");
	} else {
		console.log("use: --force to update records");
	}
} catch (error) {
	console.log(error.message)
}