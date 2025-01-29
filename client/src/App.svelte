<script>
import Panel from "./Panel.svelte";
import Chart from "./Chart.svelte";
import * as wDB from "./weatherDB";

const screens = [
	{ label: "nu", id: "now" },
	{
		label: "dag",
		id: "day",
		chartCfg: { minimum: false, average: true, maximum: false },
	},
	{
		label: "maand",
		id: "month",
		chartCfg: { minimum: true, average: false, maximum: true, zoom: "day" },
	},
	{
		label: "jaar",
		id: "year",
		chartCfg: { minimum: true, average: true, maximum: true, zoom: "month" },
	},
	{
		label: "alles",
		id: "all",
		chartCfg: { minimum: true, average: true, maximum: true, zoom: "year" },
	},
];

let screenIdx = {};
screens.forEach((scr) => (screenIdx[scr.id] = scr));

let sensors = [];
let sensor = "";
let currentScreen = "now";
let currentDate = new Date();
let sensorTypeSwitch = "temp";
let sensorType = sensorTypeSwitch;
let lastUpdate = new Date(Date.UTC(1970));
let label = "";
let data = {};
let chartCfg;
let interval;

async function updateData(screenId, sensorId, type, nowDate) {
	console.log({ screenId, sensorId, type, nowDate });
	// avoid any automatic refresh while we are busy
	if (interval) {
		clearInterval(interval);
	}
	let date = nowDate;
	if (screenId && sensor && type) {
		const recent = await wDB.getLastUpdate(sensorId, type);
		switch (screenId) {
			case "now":
				data = await wDB.getCurrentSensorData(sensorId, type);
				data.current = recent.current;
				date = new Date();
				label = "";
				break;
			case "day":
				data = await wDB.getDaySensorData(sensorId, type, date);
				label = date.toLocaleDateString();
				break;
			case "month":
				data = await wDB.getMonthSensorData(sensorId, type, date);
				label = `${date.getMonth() + 1}-${date.getFullYear()}`;
				break;
			case "year":
				data = await wDB.getYearSensorData(sensorId, type, date);
				label = date.getFullYear();
				break;
			case "all":
				data = await wDB.getAllSensorData(sensorId, type);
				label = "";
				break;
			default:
				break;
		}
		currentDate.setTime(date.getTime());
		currentScreen = screenId;
		chartCfg = screenIdx[screenId].chartCfg;
		lastUpdate = recent.lastUpdate;
		// make switch happen after data has been fetched to avoid
		// delay between switching symbols and switching data
		sensorType = sensorTypeSwitch;
		sensor = sensorId;
		// and refresh again after 2 mins
		interval = setInterval(() => {
			updateData(screenId, sensorId, type, date);
		}, 120000);
	}
}

function zoom(date) {
	const zoomScreen = screenIdx[currentScreen];
	console.log(zoomScreen, sensor, sensorType, date);
	updateData(zoomScreen, sensor, sensorType, date);
}

function setScreen(screen) {
	currentScreen = screen;
	updateData(currentScreen, sensor, sensorTypeSwitch, currentDate);
}
// start the show
async function start() {
	const res = await wDB.getSensors();
	sensors = res;
	sensor = sensors[0];
	updateData(currentScreen, sensor, sensorTypeSwitch, currentDate);
}
start();
</script>

<main>
  <!-- header and options -->
  <div class="header">
    <div>
      <h2>Weerstation</h2>
      <!-- dropdown menu -->
      {#if sensor}
        <select bind:value={sensor}>
          {#each sensors as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
      {/if}
    </div>
    <!-- switch between temp and humid -->
    <div class="radio-group">
      <label>
        °C
        <input type="radio" bind:group={sensorTypeSwitch} value={"temp"} />
      </label>
      <label>
        %Luchtv.
        <input type="radio" bind:group={sensorTypeSwitch} value={"humid"} />
      </label>
    </div>
  </div>
  {#if sensor}
    <!-- main panel goes here -->
    {#if chartCfg}
      <Chart {sensorType} {chartCfg} {data} {zoom} />
    {:else}
      <Panel {sensorType} {...data} />
    {/if}
  {/if}

  <div class="footer">
    <div>
      {#each screens as screen}
        {#if screen.id == currentScreen}
          [{screen.label}]
        {:else}
          [
          <a
            href="#{screen.id}"
            on:click|preventDefault={() => (setScreen(screen.id))}
          >
            {screen.label}
          </a>
          ]
        {/if}
      {/each}
    </div>
    <div>{label}</div>
    <div>Laatste wijziging: {lastUpdate.toLocaleString()}</div>
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    margin: 10pt auto;
    width: 800px;
    height: 400px;
    border-left: 1px solid lightgray;
    border-right: 1px solid lightgray;
    padding-left: 20px;
    padding-right: 20px;
    font-family: "Helvetica Neue", Arial;
  }

  .header {
    display: flex;
    justify-content: space-between;
  }

  .radio-group {
    padding: 0.5em 0 0 0;
  }

  .header h2 {
    float: left;
    margin: 0;
  }

  .header select {
    position: relative;
    top: 0.1em;
    float: left;
    clear: left;
    font-size: inherit;
    font-family: inherit;
    z-index: 7;
  }

  .header label {
    position: relative;
    z-index: 7;
  }

  .footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.7em;
  }
</style>
