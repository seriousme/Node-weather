require ('./jsonDateParse');

var ranges={
	now:{ adjust:function (d){ d.setHours(d.getHours()-12); },
		  inRange:function(d1,d2) { return true}
		},
	day:{ adjust:function (d){ d.setDate(d.getDate()-1); },
		  inRange:function(d1,d2) { return (d1.getHours()==d2.getHours())}
		},
	week:{ adjust:function (d){ d.setDate(d.getDate()-7);},
		   inRange:function(d1,d2) { return (d1.getDay()==d2.getDay())}
		},
	month:{ adjust:function (d){ d.setMonth(d.getMonth()-1); },
		  inRange:function(d1,d2) { return (d1.getDay()==d2.getDay())}
		},
	year:{ adjust:function (d){ d.setFullYear(d.getFullYear()-1);},
		  inRange:function(d1,d2) { return (d1.getMonth()==d2.getMonth())}
		},
};


for  (r in ranges){
	var d=new Date();
	var a;
	console.log(r);
	console.log(d);
	ranges[r].adjust(d);
	d2=new Date();
	console.log(ranges[r].inRange(a,d2));
	console.log(d);
}





