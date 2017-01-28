var ractive
var sensorData = {}
var sensorType = 'temp'

ractive = new Ractive({
  el: output,
  template: '#template',
  data: {
    scale: function (val, valueType) {
      // quick and dirty...
      if (valueType === 'temp')
        return 2 * Math.abs(val)
      else
        return Math.abs(val / 2)
    },
    format: function (val, valueType) {
      if (typeof (val) != 'undefined')
        val = Number(val)
      if (valueType === 'temp')
        return val.toFixed(1) + '°'
      else
        return val.toFixed(1) + '%'
    },
    getColor: function (val) {
      // quick and dirty function to pick a colour - the higher the
      // temperature, the warmer the colour
      var r = Math.max(0, Math.min(255, Math.floor(2.56 * (val + 50))))
      var g = 100
      var b = Math.max(0, Math.min(255, Math.floor(2.56 * (50 - val))))

      return 'rgb(' + r + ',' + g + ',' + b + ')'
    }
  }
})

// when the user makes a selection from the drop-down, update the chart

ractive.observe('sensorType', function (value) {
  sensorType = value
  this.set({
    sensorData: sensorData[sensorType]
  })
})

// load our data
$.getJSON('/weather/now').then(function (data) {
  var idx = 0
  sensorData = {temp: [],humid: []}
  for (id in data) {
    if ((id == 'Buiten') || (id == 'Kas')) {
      sensorData.temp[idx] = data[id].temp
      sensorData.temp[idx].name = id
      sensorData.humid[idx] = data[id].humid
      sensorData.humid[idx].name = id
      idx++
    }
  }
  ractive.set({
    sensorData: sensorData[sensorType]
  })
})
