const dbUrlObject = new URL(window.location.href);
dbUrlObject.port = "5984";
dbUrlObject.pathname = "/weatherdb/_design/data/_view/byhour";
const dbUrl = dbUrlObject.href;
const monthLabels = [
	"J",
	"F",
	"M",
	"A",
	"M",
	"J",
	"J",
	"A",
	"S",
	"O",
	"N",
	"D",
];

async function getWeatherData(params) {
	const url = new URL(dbUrl);
	for (const key in params) {
		const value = params[key];
		url.searchParams.append(
			key,
			typeof value === "object" ? JSON.stringify(value) : value,
		);
	}
	const res = await fetch(url);
	const json = res.json();
	return json;
}

function arrayFromDate(d) {
	// compensate for data starting at 0
	return [
		d.getUTCFullYear(),
		d.getUTCMonth() + 1,
		d.getUTCDate(),
		d.getUTCHours(),
	];
}

function dateFromArray(arr) {
	// compensate for data starting at 0
	if (arr.length > 1) {
		arr[1] -= 1;
	}
	return new Date(Date.UTC.apply(null,arr));
}

async function getSensors() {
	const data = await getWeatherData({ group_level: 1 });
	return data.rows.map((item) => item.key[0]);
}

async function getLastUpdate(sensorid, type) {
	const query = {
		reduce: false,
		descending: true,
		limit: 1,
		startkey: [sensorid, type, {}],
	};
	const data = await getWeatherData(query);
	return {
		current: data.rows[0].value,
		lastUpdate: new Date(data.rows[0].id),
	};
}

// most current data
async function getCurrentSensorData(sensorid, type) {
	const d = new Date();
	d.setHours(d.getHours() - 12);
	const query = {
		group_level: 6,
		startkey: [sensorid, type, ...arrayFromDate(d)],
		endkey: [sensorid, type, {}],
	};
	const data = await getWeatherData(query);
	// get the average
	const result = data.rows.reduce(
		(acc, row) => {
			const item = row.value;
			return {
				min: item.min < acc.min ? item.min : acc.min,
				max: item.max > acc.max ? item.max : acc.max,
				count: acc.count + item.count,
				sum: acc.sum + item.sum,
			};
		},
		{
			min: Number.POSITIVE_INFINITY,
			max: Number.NEGATIVE_INFINITY,
			count: 0,
			sum: 0,
		},
	);
	return {
		min: result.min,
		max: result.max,
		avg: Number((result.sum / result.count).toFixed(1)),
	};
}

// get data for the chart
async function getChartData(id, type, group_level, date) {
	// group_level -1 because we add 1 item to the key
	const key = [id, type, ...arrayFromDate(date)].slice(0, group_level - 1);
	// build query
	const query = {
		group_level,
		startkey: [...key, 0],
		endkey: [...key, {}],
	};
	// get the chart data
	const data = await getWeatherData(query);
	const items = data.rows.map((row) => {
		return {
			avg: Number((row.value.sum / row.value.count).toFixed(1)),
			min: row.value.min,
			max: row.value.max,
			date: dateFromArray(row.key.slice(2)),
		};
	});
	return items;
}

function makeDate(sourceDate,type){
	if (typeof sourceDate === "object") {
		return sourceDate;
	}
	const date= new Date();
	if (type === "day"){
		return date.setDate(date.getDate() - 1);
	}
	if (type === "month"){
		return date.setMonth(date.getMonth() - 1);
	}
	if (type === "year"){
		return date.setFullYear(date.getFullYear() - 1);
	}
}

// hourly data for a day
async function getDaySensorData(id, type, sourceDate) {
	const date = makeDate(sourceDate,"day");
	const data = await getChartData(id, type, 6, date);
	const result = data.map((item) => {
		item.label = item.date.getHours();
		return item;
	});
	return result;
}

async function getMonthSensorData(id, type, sourceDate) {
	const date = makeDate(sourceDate,"month");
	const data = await getChartData(id, type, 5, date);
	const result = data.map((item) => {
		item.label = item.date.getDate();
		return item;
	});
	return result;
}

async function getYearSensorData(id, type, sourceDate) {
	const date = makeDate(sourceDate,"year");
	const data = await getChartData(id, type, 4, date);
	const result = data.map((item) => {
		item.label = monthLabels[item.date.getMonth()];
		return item;
	});
	return result;
}

// all years since start
async function getAllSensorData(id, type) {
	const date = new Date();
	const data = await getChartData(id, type, 3, date);
	const result = data.map((item) => {
		item.label = item.date.getFullYear();
		return item;
	});
	return result;
}

async function getLastUpdates() {
	const type = "temp";
	const sensors = await getSensors();
	const result = Promise.all(
		sensors.map(async (sensor) => {
			const last = await getLastUpdate(sensor, type);
			return {
				sensor,
				type,
				current: last.current,
				lastUpdate: last.lastUpdate.toLocaleString(),
			};
		}),
	);
	return result;
}

export {
	getSensors,
	getLastUpdate,
	getCurrentSensorData,
	getDaySensorData,
	getMonthSensorData,
	getYearSensorData,
	getAllSensorData,
};
