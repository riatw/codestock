require('angular');
var SETTING = require('../setting.js')();

module.exports = angular.module('mynote').service('stateObject', function() {
	var service = {
		currentUser: "",
		currentTagId : "all",
		currentNoteId: null
	}

	return service;
});