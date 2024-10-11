import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
const path = "/dev/ttyUSB0";
const baudRate = 57600;

// start listening to the serialPort
function startSerial() {
	const port = new SerialPort({ path, baudRate });
	const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
	parser.on("data", console.log);
	console.log("started reading on", path);
}

startSerial();
