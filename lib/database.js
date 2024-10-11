import ConfigJson from "../config.json" with { type: "json" };
import Nano from "nano";

export function openDB() {
	const nano = Nano(ConfigJson.writer);
	const weatherdb = nano.use("weatherdb");
	return weatherdb;
}
