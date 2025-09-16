import Express from "express";
import { startSerialReader } from "./readSerial.js";

const port = 8080;
const localFile = (file) => new URL(file, import.meta.url).pathname;
const staticSite = localFile("./client/dist");

// start the serial reader in the same process

startSerialReader(true);

const app = Express();
app.use("/", Express.static(staticSite));
app.listen(port, () => {
	console.log("listening");
});
