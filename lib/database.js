import Nano from "nano";
import ConfigJson from "../config.json" with { type: "json" };

export function openDB() {
	const nano = Nano(ConfigJson.writer);
	const weatherdb = nano.use("weatherdb");
	return weatherdb;
}
