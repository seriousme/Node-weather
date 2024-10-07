import { ConfigJson } from "./config.js";
import Nano from "nano";

export function openDB() {
	const nano = Nano(ConfigJson.writer);
	const weatherdb = nano.use("weatherdb");
    return weatherdb;
}
