<script>
  import { createEventDispatcher } from "svelte";

  export let sensorType = "temp";
  export let chartCfg = {
    minimum: true,
    average: true,
    maximum: true
  };
  export let data = [];
  $: units = sensorType === "temp" ? "°" : "%";
  $: scaling = sensorType === "temp" ? 2 : 0.5;

  const scale = val => Math.abs(scaling * val);
  const minmax = c => Math.max(0, Math.min(255, Math.floor(2.56 * c)));
  const getColor = val => `rgb(${minmax(50 + val)},100,${minmax(50 - val)})`;
  const dispatch = createEventDispatcher();
  const zoomHandler = date => () => dispatch("zoom", { date,zoom:chartCfg.zoom });
  
</script>

<style>
  .chart {
    flex: 1;
    margin-left: 20px;
    margin-right: 20px;
    padding: 2em 0 0 0;
  }

  .bar-chart {
    position: relative;
    padding: 0 0 3em 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .bar-group {
    position: relative;
    float: left;
    height: 100%;
    text-align: center;
  }

  .axis-label {
    position: absolute;
    bottom: -2em;
    left: 0;
    width: 100%;
  }

  .bar-outer {
    position: absolute;
    width: 100%;
    padding: 0 1px;
    box-sizing: border-box;
  }

  .bar-outer.positive {
    bottom: 20%;
  }

  .bar-outer.positive .bar-inner {
    bottom: 0;
    border-top: 1px solid #333;
    border-left: 1px solid #333;
    border-right: 1px solid #333;
    border-radius: 2px 2px 0 0;
  }

  .bar-outer.negative {
    top: 80%;
  }

  .bar-outer.negative .bar-inner {
    top: 0;
    border-bottom: 1px solid #333;
    border-left: 1px solid #333;
    border-right: 1px solid #333;
    border-radius: 0 0 2px 2px;
  }

  .bar-outer.high.negative {
    z-index: 6;
  }

  .bar-inner {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .high.positive span {
    top: -0.6em;
    font-weight: bold;
  }

  .low.negative span {
    bottom: -0.6em;
    font-weight: bold;
  }

  .low.positive span {
    top: 0.8em;
    color: white;
    text-shadow: 0 0 3px rgba(0, 0, 0, 1), 0 0 3px rgba(0, 0, 0, 1),
      0 0 3px rgba(0, 0, 0, 1);
  }

  .high.negative span {
    bottom: 0.8em;
    color: white;
    text-shadow: 0 0 3px black, 0 0 3px black, 0 0 3px black;
  }

  .bar-chart span {
    position: absolute;
    width: 100%;
    left: 0;
    font-size: 0.7em;
    line-height: 0;
    z-index: 6;
  }

  .axis {
    position: relative;
    width: 100%;
    height: 0;
    border-top: 1px solid #333;
    z-index: 5;
    left: 0;
    top: 80%;
  }
  
  .clickable {
    cursor:pointer;
  }
</style>

<div class="chart">

  <!-- the chart -->
  <div class="bar-chart" >
    <!-- 24 sections, one for hour -->
    {#each data as item}
      <div
        class="bar-group {chartCfg.zoom?'clickable':''}"
        style="width: {100 / data.length}%;"
        on:click={zoomHandler(item.date)}>

        {#if chartCfg.maximum}
          <!-- maximum temperature -->
          <div
            class="bar-outer high {item.max >= 0 ? 'positive' : 'negative'}"
            style="height: {scale(item.max, sensorType)}%;">
            <div
              class="bar-inner"
              style="background-color: {getColor(item.max)};" />
            <span>{item.max + units}</span>
          </div>
        {/if}

        {#if chartCfg.average}
          <!-- average temperature -->
          <div
            class="bar-outer low {item.avg >= 0 ? 'positive' : 'negative'}"
            style="height: {scale(item.avg, sensorType)}%;">
            <div
              class="bar-inner"
              style="background-color: {getColor(item.avg)};" />
            <span>{item.avg + units}</span>
          </div>
        {/if}

        {#if chartCfg.minimum}
          <!-- minimum temperature -->
          <div
            class="bar-outer low {item.min >= 0 ? 'positive' : 'negative'}"
            style="height: {scale(item.min, sensorType)}%;">
            <div
              class="bar-inner"
              style="background-color: {getColor(item.min)}" />
            <span>{item.min + units}</span>
          </div>
        {/if}

        <!-- axis label -->
        <span class="axis-label">{item.label}</span>
      </div>
    {/each}

    <!-- horizontal line representing freezing -->
    <div class="axis" />
  </div>
</div>
