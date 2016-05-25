/*jslint plusplus: true, browser: true, devel: true */
/*global scormSuspendData*/

var items = [
   {
      id: "trueFalse0"
   }, {
      id: "trueFalse1"
   }, {
      id: "trueFalse2"
   }];

var itemsToString = function () {
   "use strict";
   var textOut = '';

   this.forEach(function (item) {
      textOut += item.id + ': ' + item.checked.toString() + '\n';
   });

   return textOut;
};

function makeInterface() {
   //find their home
   "use strict";
   var home = document.getElementById('boxes');
   items.forEach(function (item) {
      //make it
      var box = document.createElement("input");
      box.setAttribute("id", item.id);
      box.setAttribute("name", item.id);
      box.setAttribute("type", "checkbox");
      box.checked = item.checked;

      //add it
      home.appendChild(box);
   });
}

function updateItems() {
   "use strict";
   items.forEach(function (item, counter) {
      item.checked = document.getElementById(item.id).checked;
   });
}

function calcScore() {
   "use strict";

   var correctCount = 0;
   items.forEach(function (item) {
      correctCount += item.checked ? 1 : 0;
   });

   return correctCount / items.length;
}

function onUnload() {
   "use strict";
   updateItems();
   scormSuspendData.setScore(calcScore(), 2);
   items.toString = itemsToString;
   scormSuspendData.setData(items);

   debugger;
}

function doOnload() {
   "use strict";
   scormSuspendData.setDebugIsOn(true);

   //get data
   var dataIn = scormSuspendData.getData();

   //check if we got any
   if (dataIn !== '') {
      items = dataIn;
   }

   //set up the place
   makeInterface();

   window.onbeforeunload = onUnload;
}

//get us goinging
window.addEventListener('load', doOnload);
