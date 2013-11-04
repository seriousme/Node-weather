var a={ max: '14.8', min: '14.7', cnt: 1, avg: '14.8' };
var i='avg';
var c='cnt';
var b= Number('14.7');


a[i]='6.4';
a[c]='2';

console.log(a[c]*a[i]);
	
a[i]=((a[c]*a[i]+b)/++a[c]);
console.log(a);

//setAvg2 14.7 
//setAvg3 { max: '14.8', min: '14.7', cnt: 2, avg: NaN }