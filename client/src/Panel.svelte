<script>
  export let max = 0;
  export let min = 0;
  export let current = 0;
  export let avg = 0;
  export let sensorType = "temp";
  $: units= (sensorType === "temp")?"°":"%";
</script>

<style>
  .panel {
    display: flex;
    flex: 1;
    justify-content: space-between;
    margin-left: 20px;
    margin-right: 20px;
    padding: 2em 0 0 0;
  }

  .currentValue {
    font-size: 5em;
  }
</style>

<div class="panel">
  <div />
  <div class="currentValue">{current+units}</div>
  <div>
    <p>Maximum: {max+units}</p>
    <p>Gemiddeld: {avg+units}</p>
    <p>Minimum: {min+units}</p>
  </div>
</div>
