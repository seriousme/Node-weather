// load our data

$.getJSON('/weather').then(function (sensordata) {
  var sensors = []
  for (sensor in sensordata)
    sensors.push({name: sensor,tab: sensor + 'Tab'})

  var ractiveTab = new Ractive({
    el: tabs,
    template: '#tabsTemplate',
    data: { sensors: sensors}
  })
  var ractives = {}
  for (sensor in sensordata) {
    ractives[sensor] = new Ractive({
      el: sensor,
      template: '#nowTemplate',
      data: sensordata[sensor]
    })
  }
  $('#tabs').tabs()
})
