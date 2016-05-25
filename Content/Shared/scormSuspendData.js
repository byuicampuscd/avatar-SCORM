/*jslint plusplus: true, browser: true, devel: true*/
/*global doSetValue, doGetValue, doCommit, doTerminate, doInitialize */
 
/**
 * Author: Joshua McKinney 1/4/2016
 * Scorm Suspend Data
 * Copyright: Brigham Young University - Idaho 2016
 * 
 * This module assumes that the SCORM APIwrapper has been loaded. Its designed to allow for an easy three function call interface 
 * that allows for data to persist from attempt to attempt but still allow for a score to be set each time. 
 * The completion_status or success_status is not set.
 * In d2l Make sure that getData is not called befor the 'load' event on window
 * 
 * FUNCTIONS
 * getData() 
 *    return: string or object, if no data then an empty string
 *       Call this to get started. The data from the last session will be returned as string or object. 
 * setScore(score [, decimalPlaces]) 
 *    score: number between 0 and 1 inclusive, 
 *    decimalPlaces: optional integer 0 through 4, number of decimal places to keep when saving score DEAULT: 0
 *       Call this to set a score.
 * setData(data)
 *    data: a string, array or object to be saved to the lms.
 *       Call this in an unload function. It saves the data as SCORM suspendData and one SCORM Interaction then closes the SCORM connection.
 *       If the object has a custom toString function it will be used when saving the object as an interaction for the teacher to read eaiser. 
 *       Otherwise it will just use JSON.stringify
 * closeWithOutSetData()
 *       Call this to close SCORM the correct way without updating any data.
 * 
 * Options:
 *    setDebugIsOn: 
 *       DEFAULT: false
 *          pass a bool to console.log() the lms calls and errors or not. 
 *    setSaveInteractionIsOn: 
 *       DEFAULT: TRUE   
 *          pass a bool to turn on or off saving the same data as a SCORM interaction for the teacher to see. 
 */

var scormSuspendData = (function () {
   "use strict";
   var debugIsOn = false,
      saveInteractionIsOn = true;

   function log(words) {
      if (debugIsOn) {
         console.log(words);
      }
   }

   function getVal(command, text) {
      var val = doGetValue(command);
      log(command + ': "' + val + '"');

      return val;
   }

   function setVal(command, text) {
      var val = doSetValue(command, text);
      log(command + ': Success:' + val + ', Value:"' + text + '"');
   }

   /**
    * Takes a number between 0 and 1 inclusive and saves the score to the LMS.
    */
   function setScore(score, digits) {
      var raw, scaled, precision;

      //make sure they are numbers
      digits = parseInt(digits, 10);
      score = parseFloat(score);

      //check if a number and bounds 
      if (isNaN(digits) || digits > 4 || digits < 0) {
         digits = 0;
      }
      //check if a number and bounds 
      if (isNaN(score) || score > 1 || score < 0) {
         throw "Score is not a number or less than 0 or greater than 1";
      }

      raw = (100 * score).toFixed(digits);
      precision = raw.length - 1;
      if (score < 0.01) {
         precision -= 1;
      }
      scaled = score.toPrecision(precision);

      //in range set score
      setVal("cmi.score.raw", raw);
      setVal("cmi.score.max", "100");
      setVal("cmi.score.min", "0");
      setVal("cmi.score.scaled", scaled);
   }

   /**
    * It gets the data from the lms and parses it from JSON back to a JS object if it can.
    */
   function getData() {
      //start up SCORM
      doInitialize();

      //getVal calls doGetValue which starts SCORM if it hasent been;
      var val = getVal("cmi.suspend_data");
      if (val !== '') {
         try {
            val = JSON.parse(val);
         } catch (e) {
            log('Value from getData can not be parsed into json. message:' + e.message);
         }
      }

      return val;
   }

   /**
    * Saves data to interaction for teacher report
    */
   function saveInteraction(stringIn) {
      //Check length
      if (stringIn.length > 4000) {
         throw "Data to be saved in interaction is too long.";
      }

      //set type 
      setVal("cmi.interactions.0.id", "allData");
      setVal("cmi.interactions.0.type", "other");

      //set response
      setVal("cmi.interactions.0.learner_response", stringIn);
   }

   /**
    * This calls the toString on the object to be saved as a SCORM Interaction. 
    * The purpose is to convert the data from a JavaScript object to a format eaiser to read for non-techs (teachers).
    * If the function has not been changed or does not return a string it just uses the JSON string passed in made from JSON.stringify earlier.
    */
   function callToString(objIn, JSONIn) {
      var funGut = objIn.toString.toString(),
         standardToString = 'function toString() { [native code] }',
         stringOut = objIn.toString();

      //if no good then just use the json
      if (funGut === standardToString || typeof stringOut !== 'string') {
         stringOut = JSONIn;
      }

      //save it
      saveInteraction(stringOut);
   }

   /**
    * Runs all the required SCORM functions to close
    */
   function close() {
      setVal("cmi.exit", "suspend");
      doCommit();
      doTerminate();
   }

   /**
    * Takes a string or an js obj to be JSON stringified and then saves it to the LMS.
    * Errors if the length of string is too long.
    */
   function setData(data) {
      var dataType = typeof data,
         missing = data === null || dataType === 'undefined',
         validType = dataType === 'string' || dataType === 'object' || Array.isArray(data),
         dataString;

      //validate data
      if (missing || !validType) {
         throw "Data to save is not a string or a JavaScript object or array.";
      }

      //convert if necessary
      if (dataType === 'object') {
         dataString = JSON.stringify(data);
      } else {
         dataString = data;
      }

      //check length
      if (dataString.length > 64000) {
         throw "Data length to save to suspend data is greater than 64000.";
      }

      //save it
      setVal("cmi.suspend_data", dataString);

      //save it as an interaction as well
      if (saveInteractionIsOn) {
         if (dataType === 'object') {
            callToString(data, dataString);
         } else {
            saveInteraction(dataString);
         }
      }

      //close
      close();
   }

   function setDebugIsOn(debugIn) {
      debugIsOn = debugIn;
   }

   function setSaveInteractionIsOn(saveInteractionIn) {
      saveInteractionIsOn = saveInteractionIn;
   }

   return {
      setScore: setScore,
      getData: getData,
      setData: setData,
      closeWithOutSetData: close,
      setDebugIsOn: setDebugIsOn,
      setSaveInteractionIsOn: setSaveInteractionIsOn
   };
}());
