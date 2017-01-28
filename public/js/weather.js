var sensorData = {}
var ractive
var sensorIds = []
var current = {}
var myInterval

var sensorTypes = {temp: 0,humid: 1}
var monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

// var dbUrl= 'http://'+location.hostname+':5984/weatherdb/_design/data/_view/byhour'
var dbUrl = 'http://raspiw:5984/weatherdb/_design/data/_view/byhour'

// provide our own getJSON to avoid needing jQuery
var promises = {}
function getJSON (url) {
  if (!promises[ url ]) {
    promises[ url ] = new Ractive.Promise(function (fulfil) {
      var xhr = new XMLHttpRequest()
      xhr.onload = function () {
        fulfil(JSON.parse(xhr.responseText))
        // do not cache results
        delete (promises[ url ])
      }
      xhr.open('GET', url)
      xhr.send()
    })
  }
  return promises[ url ]
}

// provide a method to pick up QueryString values, eg: http://localhost:8080/interval.html?date=2014-11-11
function getQueryStringValue (key) {
  return unescape(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + escape(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'))
}

// enable switching between screens
function setScreen (scr) {
  if (screens.idx[scr]) {
    current.screen = screens.idx[scr]
    // reset the date when switching to the "now" screen
    if (! current.screen.chart)
      current.date = ''

    updateData()
  }
}

// enable drill down in charts
function drillDown (val) {
  if (current.screen.zoom) {
    current.date = val
    setScreen(current.screen.zoom)
  }
}

// most current data
function getCurrentSensorData (id, type) {
  // var d=new Date(2014,6,20,16)
  var d = new Date()
  d.setHours(d.getHours() - 12)
  var startparams = [id, type, d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours()]
  var endparams = [id, type, {}]

  // get the average
  var query = dbUrl + '?group_level=6&startkey=' + JSON.stringify(startparams) + '&endkey=' + JSON.stringify(endparams)

  getJSON(query).then(function (data) {
    var min = Infinity
    var max = -Infinity
    var sum = 0
    var count = 0
    var current = 0
    for (var idx in data.rows) {
      var row = data.rows[idx]
      if (row.value.min < min)
        min = row.value.min
      if (row.value.max > max)
        max = row.value.max
      sum += row.value.sum
      count += row.value.count
    }
    var avg = sum / count

    sensorData[id][type].min = min
    sensorData[id][type].max = max
    sensorData[id][type].avg = avg
    ractive.update()
  })
}

// get data for the chart
function getChartData (id, type, startDate, endDate, getLabel, groupLevel) {
  // build parameter set
  var endParams
  var lastRecord = [id, type, {}]

  // compensate for month starting at 0
  var startParams = [id, type, startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, startDate.getUTCDate(), startDate.getUTCHours()]
  if (endDate) {
    endParams = [id, type, endDate.getUTCFullYear(), endDate.getUTCMonth() + 1, endDate.getUTCDate(), endDate.getUTCHours()]
  }else {
    endParams = lastRecord
  }
  // get the chart data and update the chart once done
  var query = dbUrl + '?group_level=' + groupLevel + '&startkey=' + JSON.stringify(startParams) + '&endkey=' + JSON.stringify(endParams)
  // console.log(query)
  getJSON(query).then(function (data) {
    sensorData[id][type].chart = { items: [],labels: []}
    var items = sensorData[id][type].chart.items
    var labels = sensorData[id][type].chart.labels
    for (var idx in data.rows) {
      var row = data.rows[idx]
      var labelData = getLabel(row)
      labels.push(labelData.label)
      // calculate average
      var avg = row.value.sum / row.value.count
      avg = Number(avg.toFixed(1))
      items.push({
        avg: avg,
        min: row.value.min,
        max: row.value.max,
        date: labelData.date.toJSON()
      })
    }
    ractive.update()
  })
}

// hourly data for a day
function getDaySensorData (id, type) {
  var startDate,endDate

  if (current.date != '') {
    var d = new Date(current.date)
    startDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), getDate()))
    endDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), getDate() + 1))
    endDate.setMinutes(endDate.getMinutes() - 1)
    // set label
    sensorData[id][type].date = endDate.toLocaleDateString()
  }else {
    startDate = new Date()
    // go back 1 day
    startDate.setDate(startDate.getDate() - 1)
  }
  var getDayLabel = function (row) {
    var result = {}
    // compensate for month starting at 0
    result.date = new Date(Date.UTC(row.key[2], row.key[3] - 1, row.key[4], row.key[5]))
    result.label = result.date.getHours()
    return result
  }

  getChartData(id, type, startDate, endDate, getDayLabel, 6)
}

// daily data for a month
function getMonthSensorData (id, type) {
  var startDate,endDate

  if (current.date != '') {
    var d = new Date(current.date)
    startDate = new Date(Date.UTC(d.getFullYear(), d.getMonth()))
    endDate = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1))
    endDate.setMinutes(endDate.getMinutes() - 1)
    // set label
    sensorData[id][type].date = (startDate.getMonth() + 1) + '-' + startDate.getFullYear()
  }else {
    startDate = new Date()
    // go back 1 month
    startDate.setMonth(startDate.getMonth() - 1)
  }
  var getMonthLabel = function (row) {
    var result = {}
    // compensate for month starting at 0
    result.date = new Date(Date.UTC(row.key[2], row.key[3] - 1, row.key[4]))
    result.label = result.date.getDate()
    return result
  }

  getChartData(id, type, startDate, endDate, getMonthLabel, 5)
}

// monthly data for a year
function getYearSensorData (id, type) {
  var startDate,endDate

  if (current.date != '') {
    var d = new Date(current.date)
    startDate = new Date(Date.UTC(d.getFullYear(), 0))
    endDate = new Date(Date.UTC(d.getFullYear() + 1, 0))
    endDate.setMinutes(endDate.getMinutes() - 1)
    // set label
    sensorData[id][type].date = startDate.getFullYear()
  }else {
    startDate = new Date()
    // go back 1 year
    startDate.setFullYear(startDate.getFullYear() - 1)
  }
  var getYearLabel = function (row) {
    var result = {}
    // compensate for month starting at 0
    result.date = new Date(Date.UTC(row.key[2], row.key[3] - 1))
    result.label = monthLabels[result.date.getMonth()]
    return result
  }
  getChartData(id, type, startDate, endDate, getYearLabel, 4)
}

// all years since start
function getAllSensorData (id, type) {
  var startDate,endDate

  startDate = new Date()
  // go back to the start
  startDate.setFullYear(2000)

  var getAllLabel = function (row) {
    var result = {}
    result.date = new Date(Date.UTC(row.key[2], 0))
    result.label = result.date.getFullYear()
    return result
  }

  getChartData(id, type, startDate, endDate, getAllLabel, 3)
}

// when did we see the last update to the database ?
function getLastUpdate (id, type) {
  // and the exact last one
  var endparams = [id, type, {}]
  var query = dbUrl + '?reduce=false&descending=true&limit=1&startkey=' + JSON.stringify(endparams)
  getJSON(query).then(function (data) {
    if (data.rows.length > 0) {
      sensorData[id][type].current = data.rows[0].value
      sensorData[id][type].lastUpdate = data.rows[0].id
      ractive.update()
    }
  })
}

// main function to refresh the data 
function updateData () {
  // avoid any automatic refresh while we are busy
  if (myInterval) {
    clearInterval(myInterval)
  }
  getJSON(dbUrl + '?group_level=1').then(function (data) {
    for (var idx in data.rows) {
      var row = data.rows[idx]
      var id = row.key[0]
      if (typeof (sensorData[id]) == 'undefined') {
        sensorIds.push({name: id})
        sensorData[id] = {}
        getLastUpdate(id)
      }
      for (var type in sensorTypes) {
        sensorData[id][type] = {}
        current.screen.getData(id, type)
        getLastUpdate(id, type)
      }
    }
    if (typeof (sensorData[current.sensor]) == 'undefined') {
      current.sensor = Object.keys(sensorData)[0]
    }
    ractive.set({
      sensors: sensorIds,
      current: current,
      selected: current.sensor,
      sensorType: current.type,
      data: sensorData[ current.sensor ][current.type]
    })
    // and refresh again after 2 mins
    myInterval = setInterval(function () { updateData() }, 120000)
  })
}

// show starts here

// define screens, which items to show and what menu
var screens = {
  idx: {},
  items: [
    {item: 'nu',  link: 'now', chart: false, getData: getCurrentSensorData },
    {item: 'dag', link: 'day',  chart: true, minimum: false, average: true, maximum: false, getData: getDaySensorData},
    {item: 'maand', link: 'month',  zoom: 'day', chart: true, minimum: true, average: false, maximum: true, getData: getMonthSensorData},
    {item: 'jaar', link: 'year',  zoom: 'month', chart: true, minimum: true, average: true, maximum: true,  getData: getYearSensorData},
    {item: 'alles',link: 'all',  zoom: 'year', chart: true, minimum: true, average: true, maximum: true,  getData: getAllSensorData}
  ]
}

// create an index on the screen data
for (var i = 0; i < screens.items.length; i++) {
  screens.idx[screens.items[i].link] = screens.items[i]
}

// create the ractive object
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
      if (valueType === 'temp')
        return val.toFixed(1) + '°'
      else
        return val.toFixed(1) + '%'
    },
    datefmt: function (val) {
      if (typeof (val) != 'undefined') {
        var d = new Date(val)
        return (d.toLocaleString())
      }
    },
    getColor: function (val) {
      // quick and dirty function to pick a colour - the higher the
      // temperature, the warmer the colour
      var r = Math.max(0, Math.min(255, Math.floor(2.56 * (val + 50))))
      var g = 100
      var b = Math.max(0, Math.min(255, Math.floor(2.56 * (50 - val))))

      return 'rgb(' + r + ',' + g + ',' + b + ')'
    },
    drill: function (val) {
      return ("drillDown('" + val + "')")
    },
    screens: screens
  }
})

// when the user makes a selection from the drop-down, update the data
ractive.observe('selected', function (value) {
  current.sensor = value
  if (typeof (sensorData[current.sensor]) != 'undefined') {
    this.set({
      data: sensorData[ current.sensor ][current.type],
      current: current
    })
  }
})

// when the user selects a radio button, update the data
ractive.observe('sensorType', function (value) {
  current.type = value
  if (typeof (sensorData[current.sensor]) != 'undefined') {
    this.set({
      data: sensorData[ current.sensor ][current.type],
      current: current
    })
  }
})

// initialize app
current.date = getQueryStringValue('date')
current.type = getQueryStringValue('type') || 'temp'
current.sensor = getQueryStringValue('sensor') || 'Buiten'
// set the screen and load the data
setScreen((getQueryStringValue('screen') || 'now'))
