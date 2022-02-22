const SerialPort = require("serialport");
const Readline = require('@serialport/parser-readline')
const comPort = "/dev/ttyUSB0";

// start listening to the serialPort
function startSerial() {
    const port = new SerialPort(comPort, { baudRate: 57600 });
    const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
    parser.on('data', console.log);
    console.log("started reading on", comPort);
}

startSerial();
