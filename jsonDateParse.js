// add json Date parsing to JSON.parse
// taken from: http://stackoverflow.com/questions/14488745/javascript-json-date-deserialization
(function() {
    var jsonParse = JSON.parse;
    var reDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i;
    function jsonDate(obj) {
        var type = typeof(obj);
        if(type == 'object') {
            for(var p in obj)
                if(obj.hasOwnProperty(p))
                    obj[p] = jsonDate(obj[p]);
            return obj;
        } else if(type == 'string' && reDate.test(obj)) {
            return new Date(obj);
        } 
        return obj;
    }
    JSON.parse = function(str) { return jsonDate(jsonParse(str)); }
})();
/*
 * Tests
 */
// var dt = JSON.parse(JSON.stringify({date: new Date()}));
// console.log(typeof(dt.date));
// console.log(JSON.parse(JSON.stringify(null)));
// console.log(JSON.parse(JSON.stringify(123)));
// console.log(JSON.parse(JSON.stringify("test")));
// console.log(JSON.parse(JSON.stringify(new Date())));
// console.log(JSON.parse(JSON.stringify([1,new Date(),2])));
// console.log(JSON.parse(JSON.stringify({d: new Date(), d2: {d3: new Date(), d4: [0,new Date(),4]}})));