// usage node delsensor.js F3 -force
import { parseArgs } from "node:util"
import { openDB } from "../lib/database.js";

const weatherdb = openDB();

const options = {
	force: { short: "f", type: "boolean" }
}

try {
	const { values, positionals } = parseArgs({ options, allowPositionals: true })
	const force = values.force;
	const sensor = positionals[0];
	if (!sensor) {
		throw (new Error("missing argument 'sensor'"));
	}

	const body = await weatherdb.list({
		start_key: "2021-12-11T17:50:00.000Z",
		include_docs: true,
	})

	console.log("Total number of unknown sensors:", body.total_rows);
	const bulk = { docs: [], };
	for (const row of body.rows) {
		if (typeof sensor !== "string" || row.doc.sensorid === sensor) {
			bulk.docs.push({
				_id: row.doc._id,
				_rev: row.doc._rev,
				_deleted: true,
			});
		}
	}
	console.log("rows to delete:", bulk.docs.length);
	if (force) {
		console.log("starting delete");
		const res = await weatherdb.bulk(bulk)
		console.log(res);
	} else {
		console.log("use: --force to delete records");
	}
} catch (error) {
	console.log(error.message)
}

