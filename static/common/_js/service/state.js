require('angular');

module.exports = angular.module('mynote').service('stateObject', function() {
	var service = {
		currentUser: "",
		currentTagId : "all",
		currentNoteId: null
	}

	return service;
});