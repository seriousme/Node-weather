function checkOutlier(data, x, maxDistance) {
	if (data.length < 3)
		return false; // need at least 3 values
	var total = 0;
	for (var i in data) {
		total += data[i];
	}
	var avg = total / data.length;
	//console.log(data,avg,x,maxDistance);

	// weed out the extremes
	var total = 0;
	for (var i in data) {
		if (Math.abs(data[i] - avg) > maxDistance) {
			//console.log("outlier",data[i]);
			data.splice(i, 1);
		} else {
			total += data[i];
		}
	}
	avg = total / data.length;
	if (Math.abs(x - avg) > maxDistance) {
		//console.log(data,avg,x,maxDistance);
		return (false);
	}
	data.splice(0, data.length);
	return true;
}
	
	
var data=[[1,2,3,4,8],
		  [7,9],
		  [1,2,3,5,5],
		  [0,6,6,7,8,15]];
for(var i in data) { 
	console.log("input",data[i],6,5);
	console.log("result =>",checkOutlier(data[i],6,3));
	console.log("output",data[i]);
	}
