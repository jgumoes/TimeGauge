// require("Storage").write("timegauge.info",{"id":"timegauge","name":"Time Gauge","src":"timegauge.app.js"});

// Load fonts
require("Font7x11Numeric7Seg").add(Graphics);
// position on screen
const X = g.getWidth()/2, Y = g.getHeight()/2;
const isScreenOn = true;
// const X = g.getWidth()/2, Y = g.getHeight()/2;

const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function clearScreen(){
	g.clear();
	// @ts-expect-error: Cannot find name error
	Bangle.loadWidgets();
	// @ts-expect-error: Cannot find name error
	Bangle.drawWidgets();
}

// functions for drawing the list

//function padTime(n){return(n>9?"":"0")+n;}
function padTime(n){return n.toString().padStart(2,0);}

function diffToString(timeDiff){
	let diff = Math.round(timeDiff/1000);
	const days = Math.floor(diff/(60*60*24));
	diff -= days*(60*60*24);
	const hours = Math.floor(diff/(60*60));
	diff -= hours*60*60;
	const mins = Math.floor(diff/60);
	const secs = diff - mins*60;
	return((days>0?days+"d":"")+(hours>0?hours+"h":"")+(mins>0?mins+"m":"")+(secs>0?secs+"s":""));
}

// functions for the time list
let scroller;
const minTime = 5000;
const times = {
	maxLength: 10,
	list: [],
	addTime: function(newMSTime){
		const nT = Math.round(newMSTime);
		if(this.list.length===0 || ((nT - this.list[0].t) >= minTime)){
			//console.log(`adding time: ${nT}`);
			this.list.unshift({
				t:nT,
				d:false
			});
		}
		//else{console.log(`time not added (${nT}-${this.list[0].t}=${nT - this.list[0].t})`);}
	},
	markForDel: function(i){
		console.log(this.list[i]);
		this.list[i].d = !this.list[i].d;
		scroller.drawItem(i);
	},
	deleteMarked: function(){
		this.list = this.list.filter(el => !el.d);
		console.log("new list: ", this.list);
	},
	clearMarked: function(){this.list.forEach(t => t.d=false);},
	anyMarked: function(){return this.list.some(t => t.d);},
	makeStrObj: function(i){
		const iTime = new Date(this.list[i].t);
		const ts = padTime(iTime.getHours())+":"+padTime(iTime.getMinutes())+":"+padTime(iTime.getSeconds());
		let ds = "";
		let prevTime;
		if(i > 0){
			//ds = diffToString(this.list[i-1].t - this.list[i].t);
			prevTime = this.list[i-1].t;
		}
		else{
			prevTime = Math.round(Date.now());
		}
		ds = diffToString(prevTime - this.list[i].t);
		return {t:ts,d:ds};
	},
	makeStrings: function(){
		return times.list.map((t,i)=>times.makeStrObj(i));
	},
};

function devTimes(length){
	console.log("DELETE devTimes");
	const diffArr = new Array(length);
	//console.log(`is DST? ${(new Date()).getIsDST()}`);
	let milliseconds = Math.round(Date.now());
	for(let i = 0; i < length-1; i++){
		const milli = Math.round(Math.random()*10*60 + 5*60)*1000;
		milliseconds -= milli;
		diffArr[i] = milli;
	}
	diffArr[length-1] = milliseconds;
	diffArr.forEach(m=>{
		times.addTime(milliseconds);
		milliseconds += m;
	});
}

function drawScroller(){
	const timeStrings = times.makeStrings();
	//console.log("timeStrings: ", timeStrings);
	//console.log(`is DST? ${(new Date()).getIsDST()}`);
	return E.showScroller({
		h : 50, // height of each menu item in pixels
		c : timeStrings.length, // number of menu items
		// a function to draw a menu item
		draw : (idx, r) => {
			//console.log("drawing: ", idx);
			const numObj = timeStrings[idx];
			//console.log(`${i} marked for delete? ${times.list[idx]}`);
			g.setBgColor((!times.list[idx].d)?"#666":"#900").clearRect(r.x,r.y,r.x+r.w-1,r.y+r.h-1);
			// draw dividers
			//g.drawLine(r.x,r.y,r.x+r.w-1,r.y);g.drawLine(r.x,r.y+r.h-1,r.x+r.w-1,r.y+r.h-1);
			g.setFont("6x8:2").setFontAlign(1, -1, 0).drawString(numObj.d,r.x+r.w-1,r.y+4);
			g.setFont("6x8:2").setFontAlign(-1, 1, 0).drawString(numObj.t,r.x+10,r.y+r.h-4);
		},
		select : function(idx, touch) {
			//console.log(`selected ${i}: {t:${timeStrings[i].t},d:${timeStrings[i].d}}`);
			times.markForDel(idx);
		},
		// optional function to be called when 'back' is tapped
		back : function() {
			console.log("back pressed (scroller)");
			if(times.anyMarked()){
				console.log("times were marked for delete");
				E.showPrompt("Delete times?").then(function(v) {
					if (v){
						console.log("'Yes' chosen");
						times.deleteMarked();
					}
					else {
						console.log("'No' chosen");
						times.clearMarked();
					}
					vc.switchView("updatingClock");
				});
			}
			else {
				console.log("no times were marked");
				vc.switchView("updatingClock");	// this should be frozenClock, but gets stuck
			}
		},
	});
}

// functions for drawing the clock

function drawDate(dateObj, dateFontsize, dateY, alignY){
	//display the current date
	const dateString = daysOfTheWeek[dateObj.getDay()] + "\n" + dateObj.getDate().toString() + "/" + (dateObj.getMonth()+1) + "/" + dateObj.getFullYear();
	//g.setFont("7x11Numeric7Seg",dateFontsize);
	g.setFont("Vector", dateFontsize);
	g.setFontAlign(0, alignY);
	g.drawString(dateString, X, dateY, true);
}

function drawDiff(){
	//console.log("drawing Diff");
	const yMax = g.getHeight()-1;
	g.drawRect(2, yMax-50, g.getWidth()-3, yMax-2);
	g.setFont("Vector", 20);
	g.setFontAlign(0,0);
	const diffStr = times.makeStrObj(0).d||"0s";
	g.drawString(diffStr,X,yMax-25, true);
}

function updateClock() {
	const d = new Date();
	g.reset();
	g.drawLine(0, 24, g.getWidth(), 24);
	//display the current time
  const h = d.getHours(), m = d.getMinutes();
	const time = padTime(h)+":"+padTime(m)+ ":"+padTime(d.getSeconds());
  g.setFont("7x11Numeric7Seg",3);
  g.setFontAlign(0,0);
  g.drawString(time, X, Y, true /*clear background*/);
	drawDate(d, 18, 30, -1);
	drawDiff();
}

function freezeClock() {
	g.reset();
	g.drawLine(0, 24, g.getWidth(), 24);
	drawDate(new Date(), 30, Y, 0);
}

// Clear the screen once, at startup
clearScreen();

// view handlers

// initiate timers, intervals, etc.
// return a callable function to clear the timers
let updateInterval = null;
const scrollerTimeout = null;
const initView={
	"updatingClock": ()=>{
		updateClock();
		updateInterval = setInterval(updateClock, 1000);
	},
	"frozenClock": function(){
		console.log("todo: frozenClock initView");
		freezeClock();
	},
	"timeList": function(){
		console.log("todo: timeList initView");
		//clearTimeout(scrollerTimeout);
		//scrollerTimeout = setTimeout(function(){scroller = drawScroller();}, 50);
		setTimeout(function(){scroller = drawScroller();}, 50);
		//scroller = drawScroller();
	}
};

const exitView = {
	"updatingClock": function(){
		//console.log("Exiting updatingClock");
		clearInterval(updateInterval);},
	"frozenClock": function(){
		//console.log("Exiting frozenClock");
		times.addTime(Date.now());
	},
	"timeList": function(){
		//console.log("Exiting timeList");
		scroller = E.showScroller();
	},
	"none": function(){}
};

// view controller
// cleanup previous view and initiate new view
//const initialView = Bangle.isLocked()?"frozenClock":"updatingClock";
const vc={
	appView: "none",// todo: view keys should be enumerated
	switchView: function(view){
		if(view!==this.appView){
			//console.log(`Switching View to "${view}"`);
			exitView[this.appView]();
			clearScreen();
			initView[view]();
			this.appView = view;
		}
	}
};

const swipeHandlers={
	"updatingClock": function(dLR, dUD){
		if(dUD === 1){
			// TODO: this needs to be cancelled when timesList opens
			// @ts-expect-error: Cannot find name error
			Bangle.setLocked(true);
		} else if(dUD === -1){
			//console.log("todo: show previous times!");
			vc.switchView("timeList");
		}
	},
	"frozenClock": function(dLR, dUD){console.log("todo: frozenClock swipeHandler");},
	"timeList": function(dLR, dUD){console.log("todo: timeList swipeHandler");}
};

// event handlers
// @ts-expect-error: Cannot find name error
Bangle.on('swipe', function(directionLR, directionUD) {
	//console.log(`swiped @ ${(new Date()).getTime()}: ${directionLR}, ${directionUD}`);
	swipeHandlers[vc.appView](directionLR, directionUD);
});

const lockHandlers={
	"updatingClock": function(off, reason){
		if(off){vc.switchView("frozenClock");}
	},
	"frozenClock": function(off, reason){
		console.log("todo: frozenClock lockHandlers");
		if(!off){vc.switchView("updatingClock");}
	},
	"timeList": function(off, reason){console.log("todo: timeList lockHandlers");}
};
// @ts-expect-error: Cannot find name error
Bangle.on('lock', function(off, reason) {
	console.log("Bangle screen locked: ", off);
	console.log("lock reason: ", reason);
	lockHandlers[vc.appView](off, reason);
});

devTimes(10);
// @ts-expect-error: Cannot find name error
if(Bangle.isLocked()){
	vc.switchView("frozenClock");
}
else {
	vc.switchView("updatingClock");
}