require('angular');
var $ = require('jquery');
var jQuery = require('jquery');
var SETTING = require('../setting.js')();

module.exports = angular.module('mynote').service('dataAPI', function(stateObject, $http, $location,Upload) {
		var service = {
			current: {
				username: "",
				sessionId: "",
				accessToken: "",
			},
			currentSessionId: function() {
				return localStorage.getItem("sessionId");
			},
			init: function() {

			},
			login: function(username, password, callback, error_callback) {
				$http.defaults.headers.common['X-MT-Authorization'] = null;

				var url = SETTING.CMSURL + "/authentication";
				url = url + "?username=" + username + "&password=" + password + "&clientId=gnote";

				$http.post(url)
				.success(function(json, status){
					localStorage.setItem("accessToken", json.accessToken);
					localStorage.setItem("sessionId", json.sessionId);
					localStorage.setItem("username", username);

					stateObject.currentUser = json;

					callback(json);
				})
				.error(function() {
					error_callback();
				});
			},
			logout: function(callback) {
				var url = SETTING.CMSURL + "/authentication";

				$http.defaults.headers.common['X-MT-Authorization'] = "MTAuth sessionId=" + localStorage.getItem("sessionId");

				$http.delete(url).success(function(json, status){
					localStorage.setItem("accessToken", "");
					localStorage.setItem("sessionId", "");

					stateObject.currentUser = null;

					callback(json);
				});
			},
			token: function(callback, error) {
				var url = SETTING.CMSURL + '/token';

				$http.defaults.headers.common['X-MT-Authorization'] = "MTAuth sessionId=" + this.currentSessionId();

				$http.post(url).success(function(json, status){
					localStorage.setItem("accessToken", json.accessToken);
					stateObject.currentUser = json;

					$http.defaults.headers.common['X-MT-Authorization'] = null;
					callback(json);
				});
			},
			get: function(filter, auth, callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID + '/entries';

				url = url + '/' + stateObject.currentNoteId;

				if ( filter == false ) {
					url = url + '?no_text_filter=1';
				}

				if ( auth ) {
					this.token(function() {
						var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");
						$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

						$http.get(url)
						.success(function(json, status){
							stateObject.currentNote = json;

							callback(json);
						})
						.error(function(status) {
							console.log(status);
							alert("接続が切断されました、リロードしてください");
						});
					});
				}
				else {
					$http.get(url)
					.success(function(json, status){
						stateObject.currentNote = json;

						callback(json);
					})
				}
			},
			load: function(type, filter, terms, callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID + '/' + filter + type;
				url = url + '?limit=100' + terms;

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");
					$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

					$http.get(url)
					.success(function(json, status){
						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			create: function(type, object, callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID + '/' + type;

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");

					$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

					$http.defaults.headers.post["Content-Type"] = 'application/x-www-form-urlencoded;application/json;charset=utf-8';

					$http({
						url: url,
						method: "POST",
						data: jQuery.param({"entry": JSON.stringify(object)})
					})
					.success(function (json, status) {
						stateObject.currentNote = json;
						stateObject.currentNoteId = json.id;

						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			update: function(type, object, callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID + '/' + type;
				url = url + "/" + object.id + "?__method=PUT";

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");

					$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

					$http.defaults.headers.post["Content-Type"] = 'application/x-www-form-urlencoded;application/json;charset=utf-8';

					$http({
						url: url,
						method: "POST",
						data: jQuery.param({"entry": JSON.stringify(object)})
					})
					.success(function (json, status) {
						stateObject.currentNote = json;
						stateObject.currentNoteId = json.id;

						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			delete: function(type, id,callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID + '/' + type;
				url = url + '/' + id;

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");

					$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

					$http({
						url: url,
						method: 'DELETE'
					})
					.success(function (json, status) {
						stateObject.currentNote = null;
						stateObject.currentNoteId = null;

						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			addStar: function(callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID;
				url = url + "/entries/" + stateObject.currentNoteId + "/score/like" + "?__method=PUT";

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");

					$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

					$http.defaults.headers.post["Content-Type"] = 'application/x-www-form-urlencoded;application/json;charset=utf-8';

					$http({
						url: url,
						method: "POST"
					})
					.success(function (json, status) {
						console.log(json);
						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			listStar: function(callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID;

				url = url + "/entries/" + stateObject.currentNoteId + '/score/like';

				this.token(function() {
					if ( localStorage.getItem("accessToken")) {
						var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");
						$http.defaults.headers.common['X-MT-Authorization'] = accessToken;
					}

					$http.get(url)
					.success(function(json, status){
						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			removeStar: function(callback) {
				var url = SETTING.CMSURL + '/sites/' + SETTING.BLOGID + '/' + "entries";
				url = url + '/' + stateObject.currentNoteId + '/score/like';

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");

					$http.defaults.headers.common['X-MT-Authorization'] = accessToken;

					$http({
						url: url,
						method: 'DELETE'
					})
					.success(function (json, status) {
						callback(json);
					})
					.error(function() {
						alert("接続が切断されました、リロードしてください");
					});
				});
			},
			upload: function(file, callback) {
				var url = SETTING.CMSURL + '/assets/upload';

				this.token(function() {
					var accessToken = "MTAuth accessToken=" + localStorage.getItem("accessToken");

					Upload.upload({
						url: url,
						data: { file: file, path: "/files", site_id: SETTING.BLOGID, autoRenameIfExists: true },
						method: "post",
						headers: {'X-MT-Authorization': accessToken},
					}).then(function (json) {
						callback(json);
					});
				});
			},
		}

		return service;
	});
