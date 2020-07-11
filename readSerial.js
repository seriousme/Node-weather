// acquire weather data from 868 weather sensors using the IT+ protocol via a JeeLink and store it in CouchDB

// log once every five minutes
const timeInterval = 5000 * 60 * 1;
// expire unnamed sensors we haven't seen for an hour
const expireInterval = 60000 * 60 * 1;
// the radio sometimes picks up garbage, when falls a change out of range
const maxTempDistance = 5;
const maxHumidDistance = 5;

const config = require("./config.json");

const nano = require("nano")(config.writer);
const weatherdb = nano.use("weatherdb");

const SerialPort = require("serialport");
const Readline = require('@serialport/parser-readline')
const comPort = "/dev/ttyUSB0";

var sensors = {};
var settings = {};

function readSensorsFromDb(init) {
  // console.log('before update:', JSON.stringify(sensors))
  weatherdb.get("config/sensorIDs", function (err, body) {
    if (!err) {
      const nowTime = new Date().getTime();
      if (settings._rev != body._rev) {
        // we got an update from the DB
        sensors = body.sensorIDs;
        settings._rev = body._rev;
        console.log(settings, sensors);
      } else {
        // no new data in sensor table, check if we need to expire unknown sensors
        for (var id in sensors) {
          if (
            typeof sensors[id].lastSeen != "undefined" &&
            nowTime - sensors[id].lastSeen > expireInterval
          ) {
            delete sensors[id];
          }
        }
      }

      settings.nextTime = nowTime + timeInterval;
      // we got valid data back, start the show
      if (init) {
        startSerial();
      }
    }
    // console.log('after update:', JSON.stringify(sensors))
  });
}

// helper function to sum an Array
Array.prototype.sum = function () {
  return this.reduce(function (a, b) {
    return a + b;
  });
};

// filter outliers from sensor data
function validData(data, item, maxDistance) {
  // we need at least 3 values to determine an average
  if (data.length < 3) {
    return false;
  }
  var avg = data.sum() / data.length;
  // define what an outlier is
  function isNoOutlier(value) {
    return Math.abs(value - avg) < maxDistance;
  }
  // filter any outliers from the dataset
  const result = data.filter(isNoOutlier);
  // check if the item was an outlier itself
  avg = result.sum() / result.length;
  if (!isNoOutlier(item)) {
    return false;
  }
  // we got a valid item
  return true;
}

// check both temp and humidity
function valuesOk(sensor, temp, humid) {
  return (
    validData(sensor.temps, temp, maxTempDistance) &&
    validData(sensor.humids, humid, maxHumidDistance)
  );
}

// store data in database
function saveData(record) {
  console.log(record.date, record.msg);
  weatherdb.insert(record, record.date, function (err, body, header) {
    if (err) {
      console.log("[weatherdb.insert] ", err.message);
      return;
    }
  });
}

function idFromSensorId(sensorid) {
  if (typeof sensors[sensorid] == "undefined") {
    sensors[sensorid] = { name: sensorid };
  }
  var sensor = sensors[sensorid];
  if (typeof sensor.nextTime == "undefined") {
    // setup the sensor data structure
    sensor.nextTime = 0;
    sensor.temps = [];
    sensor.humids = [];
    sensor.lastSeen = 0;
  }
  return sensor.name;
}

// process the message received from the serialPort
function processMsg(msg) {
  const now = new Date();
  const nowTime = now.getTime();
  const datestr = now.toJSON();
  // console.log(datestr,msg)
  // IT+ ID: F0 Temp: 14.8 Humidity: 84 RawData: 9F 05 48
  const data = msg.split(" ");
  if (data[0] === "IT+") {
    const record = {
      date: datestr,
      id: idFromSensorId(data[2]),
      sensorid: data[2],
      temp: Number(data[4]),
      humid: Number(data[6]),
      batt: data[7] == "L" ? data[7] : "ok",
      msg: msg
    };
    const sensor = sensors[record.sensorid];
    // retain the values in cache to look for outliers
    sensor.temps.push(record.temp);
    sensor.humids.push(record.humid);
    sensor.lastSeen = nowTime;
    // has the interval passed ?
    if (nowTime >= sensor.nextTime) {
      // save record if the last values made sense
      if (valuesOk(sensor, record.temp, record.humid)) {
        saveData(record);
        // and update the interval
        sensor.nextTime = nowTime + timeInterval;
        // and reset the outlier cache
        sensor.temps = [];
        sensor.humids = [];
      }
    }
  }
  // try to update the sensor ID's in the same interval
  if (nowTime >= settings.nextTime) {
    readSensorsFromDb(false);
  }
}

// start listening to the serialPort
function startSerial() {
  const port = new SerialPort(comPort, { baudRate: 57600 });
  const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
  parser.on('data', processMsg);
}

// this is where it all starts
readSensorsFromDb(true);
