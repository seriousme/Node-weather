// usage node delSensorbyDate.js 98
import { openDB } from "./lib/database.js";
const weatherdb = openDB();

const bulk = {
	docs: [],
};

function parseArgs() {
	if (process.argv.length > 3) {
		return { force: process.argv[3] === "-force", sensor: process.argv[2] };
	}
	if (process.argv.length > 2) {
		if (process.argv[2] === "-force") {
			return { force: true };
		}
		return {
			force: false,
			sensor: process.argv[2],
		};
	}
	return {};
}

function bulkDelete() {
	weatherdb.bulk(bulk, (err, body) => {
		console.log(err, body);
	});
}

function processRow(row) {
	if (typeof sensor !== "string" || row.doc.sensorid === sensor) {
		console.log(row.doc);
		bulk.docs.push({
			_id: row.doc._id,
			_rev: row.doc._rev,
			_deleted: true,
		});
	}
}

const { force, sensor } = parseArgs();
weatherdb
	.list({
		start_key: "2021-12-11T17:50:00.000Z",
		include_docs: true,
	})
	.then((body) => {
		console.log("number of rows:", body.total_rows);
		body.rows.forEach(processRow);
		console.log("rows to delete:", bulk.docs.length);
		if (force) {
			console.log("starting delete");
			bulkDelete();
		} else {
			console.log("use: -force to delete records");
		}
	})
	.catch((err) => console.log("err:", err.reason));
