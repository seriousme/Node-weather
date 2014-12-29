var config = require("./config.json");
var nano = require('nano')(config.writer);
var weatherdb = nano.use('weatherdb');

var bulk = {
	docs : []
};

function bulkDelete() {
	weatherdb.bulk(bulk, function (err, body) {
		console.log(err, body);
	})
}

weatherdb.view('data', 'unknownSensors', {
//weatherdb.view('data', 'garbage', {
	"reduce" : false,
	"include_docs" : true
}, function (err, body) {
	if (!err) {
		console.log("rows to delete:", body.total_rows);

		if (process.argv[2] == "-force") {
			body.rows.forEach(function (row) {
				bulk.docs.push({
					"_id" : row.doc._id,
					"_rev" : row.doc._rev,
					"_deleted" : true
				});
			});
			console.log("rows:", body.total_rows);
			bulkDelete();
		} else {
			console.log("use: -force to delete records");
		}
	} else {
		console.log("err:", err.reason);
	}
});
