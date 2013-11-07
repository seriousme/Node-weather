 var now=new Date();
 var next=new Date();
 var nowTime=now.getTime();
 next.setMinutes(now.getMinutes()+5);
 var nextTime=next.getTime();
 console.log(now)
 console.log(next);
 console.log(nextTime-nowTime);
