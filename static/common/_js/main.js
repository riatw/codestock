var $ = require('jquery');
var jQuery = require('jquery');
require('angular');
require('angular-route');
require('angular-bootstrap');
require('angular-scroll');
require('marked');
require('angular-marked');
require('ng-file-upload');
var ace = require('brace');
require('brace/mode/html');
require('brace/mode/css');
require('brace/mode/scss');
require('brace/mode/javascript');
require('brace/theme/monokai');
require('angular-ui-ace');
require('angular-hotkeys');
require('./setting.js');
var SETTING = require('./setting.js')();

var sass = new Sass('common/lib/sassjs/sass.worker.js');

sass.options({
  // Format output: nested, expanded, compact, compressed
  style: Sass.style.nested,
  // Precision for outputting fractional numbers
  // (-1 will use the libsass default, which currently is 5)
  precision: -1,
  // If you want inline source comments
  comments: false,
  // Treat source_string as SASS (as opposed to SCSS)
  indentedSyntax: false,
  // String to be used for indentation
  indent: '  ',
  // String to be used to for line feeds
  linefeed: '\n',

  // data passed through to the importer callback
  // must be serializable to JSON
  importer: {},

  // Path to source map file
  // Enables the source map generating
  // Used to create sourceMappingUrl
  sourceMapFile: 'file',
  // Pass-through as sourceRoot property
  sourceMapRoot: 'root',
  // The input path is used for source map generation.
  // It can be used to define something with string
  // compilation or to overload the input file path.
  // It is set to "stdin" for data contexts
  // and to the input file on file contexts.
  inputPath: 'stdin',
  // The output path is used for source map generation.
  // Libsass will not write to this file, it is just
  // used to create information in source-maps etc.
  outputPath: 'stdout',
  // Embed included contents in maps
  sourceMapContents: true,
  // Embed sourceMappingUrl as data uri
  sourceMapEmbed: false,
  // Disable sourceMappingUrl in css output
  sourceMapOmitUrl: true,
}, function callback(){});

//Define a Module
// var mynote = angular.module('mynote', ['ui.bootstrap','ngRoute']);
var mynote = angular.module('mynote', ['ui.bootstrap','hc.marked','ngRoute','duScroll','ngFileUpload','ui.ace','cfp.hotkeys']);

var dataAPI = require('./service/dataapi.js');
var stateObject = require('./service/state.js');

// Markdown Render
angular.module('mynote').config(['markedProvider', function(markedProvider) {
	markedProvider.setOptions({
		gfm: true,
		tables: true,
		smartLists: true
	});
}]);

//Router
angular.module('mynote').config(function($routeProvider) {
	$routeProvider
	.when("/tag/:tagid", {
		controller: 'tagListController'
	})
	.when("/note/:noteid", {
		controller: 'noteListController'
	})
	.when("/note/:noteid", {
		controller: 'shareNoteController'
	})
	.when("/note/:noteid", {
		controller: 'presentationNoteController'
	});
}).run(function($route) {});

//Login
angular.module('mynote').controller("loginController", function($scope,stateObject,$rootScope, dataAPI) {
	$scope.init = function() {
		dataAPI.token(function(json) {
			$scope.currentUser = stateObject.currentUser;
			$scope.currentUserName = localStorage.getItem("username");

			$rootScope.$broadcast('BCRefreshTags');
			$rootScope.$broadcast('BCRefreshNoteList');
			// $rootScope.$broadcast('BCRefreshNoteDetail');
		});
	}

	$scope.logIn = function() {
		dataAPI.login($scope.username, $scope.password, function() {
			$scope.login_error = 0;

			$scope.currentUser = stateObject.currentUser;
			$scope.currentUserName = stateObject.currentUser.name;

			$rootScope.$broadcast('BCRefreshTags');
			$rootScope.$broadcast('BCRefreshNoteList');
			$rootScope.$broadcast('BCRefreshNoteDetail');
		},
		function() {
			$scope.login_error = 1;
		});
	}

	$scope.logOut = function(form) {
		dataAPI.logout(function() {
			$scope.currentUser = null;

			$rootScope.$broadcast('BCRefreshTags');
			$rootScope.$broadcast('BCRefreshNoteList');
			$rootScope.$broadcast('BCRefreshNoteDetail');
		});
	}
});

//addNote
angular.module('mynote').controller("addNoteModalController", function ($scope, $modal) {
	$scope.open = function (item) {
		var modalInstance = $modal.open({
			templateUrl: 'common/views/note_create.html',
			controller: addNoteController,
			resolve: {
				items: function() {
					return item;
				}
			}
		});
	}

	var addNoteController = function ($scope, $modalInstance, items, $rootScope, stateObject, $location, dataAPI, marked,Upload) {

		$scope.form = {
			title: '',
			html: '',
			css: '',
			js: '',
			tags: [],
			status: 'Draft',
			format: '',
			preview: '',
			preview_height: '',
			ace_setting_html: {
				mode:'html',
				theme:'monokai',
				useWrapMode: true,
				onLoad: function(_editor) {
					_editor.commands.addCommand({
						name: "savefile",
						bindKey: {
							win: "Ctrl-S",
							mac: "Command-S"
						},
						exec: function(editor) {
							$scope.preview();
						}
					});
				}
			},
			ace_setting_css: {
				useWrapMode : true, mode:'scss',theme:'monokai',
				onLoad: function(_editor) {
					_editor.commands.addCommand({
						name: "savefile",
						bindKey: {
							win: "Ctrl-S",
							mac: "Command-S"
						},
						exec: function(editor) {
							$scope.preview();
						}
					});
				}
			},
			ace_setting_js: {
				useWrapMode : true, mode:'javascript',theme:'monokai',
				onLoad: function(_editor) {
					_editor.commands.addCommand({
						name: "savefile",
						bindKey: {
							win: "Ctrl-S",
							mac: "Command-S"
						},
						exec: function(editor) {
							$scope.preview();
						}
					});
				}
			},
			dist: ''
		}

		$scope.noteIsLoaded = 0;

		//編集の場合
		if ( items ) {
			dataAPI.get(false, true, function(json) {
				$scope.form.title = json.title;
				$scope.form.html = json.body;
				$scope.form.css = json.more;

				if ( json.excerpt.indexOf("...") != -1 ) {
					json.excerpt = "";
				}

				$scope.form.js = json.excerpt;
				$scope.form.tags = json.tags.join(",");
				$scope.form.status = json.status;
				$scope.noteIsLoaded = 1;
			});
		}
		else {
			$scope.noteIsLoaded = 1;
		}

		$scope.ok = function () {
			var object = {};
			var tags;
			var method;

			object.title = $scope.form.title;
			object.body = $scope.form.html;
			object.more = $scope.form.css;
			object.excerpt = $scope.form.js;
			object.tags =  $scope.form.tags.split(",");
			object.status = $scope.form.status;
			object.format = $scope.form.format;

			if ( items ) {
				object.id = items.id;

				dataAPI.update("entries", object, function() {
					$modalInstance.dismiss('cancel');
					$rootScope.$broadcast('BCRefreshTags');
					$rootScope.$broadcast('BCRefreshNoteList');
					$rootScope.$broadcast('BCRefreshNoteDetail');
				});
			}
			else {
				dataAPI.create("entries", object, function() {
					$modalInstance.dismiss('cancel');
					$rootScope.$broadcast('BCRefreshTags');
					$rootScope.$broadcast('BCRefreshNoteList');
					$rootScope.$broadcast('BCRefreshNoteDetail');
				});
			}
		}

		$scope.delete = function () {
			if( window.confirm('ノートを削除します。よろしいですか？') ){
				dataAPI.delete("entries", items.id, function() {
					$modalInstance.dismiss('cancel');
					$location.path("/tag/all");
					$rootScope.$broadcast('BCRefreshNoteList');
					$rootScope.$broadcast('BCResetNoteDetail');
				});
			}
		}

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		}

		$scope.preview = function() {
			$(".m-box-editnote [name='preview']").contents().find("html").html($(".m-box-editnote [name='template']").val());
		};
	}
});

//addNote
angular.module('mynote').controller("addNoteStarController", function ($scope, dataAPI) {
	$scope.checkStar = function() {
		$scope.liked = 0;
		$scope.totalResults = 0;

		dataAPI.listStar(function(json) {
			for ( var i=0; i<json.items.length; i++ ) {
				if ( json.items[i].name == localStorage.getItem("username") ) {
					$scope.liked = 1;
				}
			}

			$scope.likedResults = json.totalResults;
		});
	};

	$scope.setStar = function() {
		if ( ! $scope.liked ) {
			dataAPI.addStar(function() {
				dataAPI.listStar(function(json) {
					$scope.liked = 1;
					$scope.likedResults = json.totalResults;
				});
			});
		}
		else {
			dataAPI.removeStar(function() {
				dataAPI.listStar(function(json) {
					$scope.liked = 0;
					$scope.likedResults = json.totalResults;
				});
			});
		}
	}

	$scope.$on('BCRefreshNoteDetail', function() {
		$scope.checkStar();
	});
});

//タグ一覧表示用のコントローラ
angular.module('mynote').controller("searchNoteController", function ($scope, stateObject,$rootScope) {

	$scope.search = function() {
		stateObject.currentSearchKeyword = $scope.q;
		console.log($scope.q);
		$rootScope.$broadcast('BCChangeSearchKeyword');
	}
});

//タグ一覧表示用のコントローラ
angular.module('mynote').controller("tagListController", function ($scope, stateObject, $routeParams, $rootScope, $location, dataAPI) {

	var that = this;

	//タグの一覧表示
	this.viewTags = function() {
		this.isNoteDetailLoaded = 0;
		this.loadTagSp = 1;

		dataAPI.load("tags", "", "" , function(json) {
			that.taglist = json.items;
			that.loadTagSp = 0;
		})
	}

	$scope.$on('BCRefreshTags', function() {
		that.currentTagId = stateObject.currentTagId;
		that.viewTags();
	});

	//URLに応じてタグを選択状態にする
	$rootScope.$on("$routeChangeSuccess", function(event, current) {
		if ( $routeParams.tagid ) {
			that.currentTagId = $routeParams.tagid;
			stateObject.currentTagId = $routeParams.tagid;

			$rootScope.$broadcast('BCRefreshNoteList');
		}
		else {
			that.currentTagId = "all";
		}
	});
});

//ノート一覧表示用のコントローラ
angular.module('mynote').controller("noteListController", function($scope, stateObject, $routeParams, $rootScope, $location,dataAPI) {

	$scope.viewNotes = function() {
		var items = [];
		var filter = "";

		//ノートが0件の際のアイコンを非表示
		$scope.noteIsEmpty = 0;

		//スピナーを表示
		$scope.spinnerView = 1;

		if ( stateObject.currentTagId != "all" ) {
			filter = "tags/" + stateObject.currentTagId + "/"
		}

		dataAPI.load("entries", filter, "&sortBy=modified_on", function(json) {
			$scope.feeds = json.items;

			//スピナーを非表示
			$scope.spinnerView = 0;

			if ( json.totalResults == 0 ) {
				//ノートが0件の際のアイコンを表示
				$scope.noteIsEmpty = 1;
			}
		})
	};

	$scope.$on('BCRefreshNoteList', function() {
		$scope.currentNoteId = stateObject.currentNoteId;
		$scope.currentTagId = stateObject.currentTagId;
		$scope.viewNotes();
		console.log("ref list");
	});

	$scope.$on('BCChangeSearchKeyword', function() {
		$scope.currentSearchKeyword = stateObject.currentSearchKeyword;
	});

	//URLに応じてノートを選択状態にする
	$rootScope.$on("$routeChangeSuccess", function(event, current) {
		if ( $routeParams.noteid ) {
			$scope.currentNoteId = $routeParams.noteid;
			stateObject.currentNoteId = $routeParams.noteid;

			$rootScope.$broadcast('BCRefreshNoteDetail');
		}
		else {
			$scope.currentNoteId = "";
		}
	});
});

angular.module('mynote').controller("noteDetailController", function($scope,stateObject, $rootScope,marked,dataAPI) {

	$scope.viewNoteDetail = function() {
		var item = stateObject.currentNote;

		if ( item ) {
			$scope.isNoteDetailLoaded = 0;

			$scope.detailTitle = item.title;
			$scope.shareUrl = location.protocol + "//" + location.host + "/share/#note/" + item.id;

			$scope.form = {};

			$scope.form.html = item.body;

			if ( item.excerpt.indexOf("...") != -1 ) {
				item.excerpt = "";
			}

			// $scope.form.js = item.excerpt;

			$scope.currentNote = item.id;

			$scope.item = item;
			$scope.isNoteDetailLoaded = 1;

			sass.compile( item.more, function callback(result) {
				$scope.$apply(function() {
					$scope.form.css = result.text;
				});

				setTimeout(function() {
					$("iframe[name='preview']").contents().find("[data-preview-html]").html( $scope.form.html );
					$("iframe[name='preview']").contents().find("[data-preview-css]").html( $scope.form.css );
					// var act = $("<script />").text(item.excerpt);
					// $("iframe[name='preview']").contents().find("head").append(act);
					var ifrm = $("iframe[name='preview']").get(0).contentWindow;
					// // 外部サイトにメッセージを投げる
					ifrm.postMessage(item.excerpt, 'http://localhost:3000/blank.html');
				}, 1000);
			});
		}
	};

	$scope.resetNoteDetail = function() {
		$scope.isNoteDetailLoaded = 0;
	}

	$scope.$on('BCRefreshNoteDetail', function() {
		$scope.currentNoteId = stateObject.currentNoteId;
		$scope.detailBody = "";
		$scope.isNoteDetailLoaded = 0;

		dataAPI.get(false, true, function(json) {
			$scope.viewNoteDetail();
		});
	});

	$scope.$on('BCResetNoteDetail', function() {
		$scope.currentNoteId = stateObject.currentNoteId;
		$scope.resetNoteDetail();
	});
});

angular.module('mynote').controller("shareNoteController", function($scope,stateObject, $rootScope,marked,dataAPI, $routeParams, $location) {

	//URLに応じてノートを選択状態にする
	$rootScope.$on("$routeChangeSuccess", function(event, current) {
		if ( $routeParams.noteid ) {
			stateObject.currentNoteId = $routeParams.noteid;

			dataAPI.get(false, false, function(json) {
				$scope.title = json.title;
				$scope.detailBody = marked(json.body, function (err, content) {
					return content;
				});
			});
		}
	});
});

angular.module('mynote').controller("presentationNoteController", function($scope,stateObject, $rootScope,marked,dataAPI, $routeParams, $location) {

	//URLに応じてノートを選択状態にする
	$rootScope.$on("$routeChangeSuccess", function(event, current) {
		if ( $routeParams.noteid ) {
			stateObject.currentNoteId = $routeParams.noteid;

			dataAPI.get(false, false, function(json) {
				$scope.title = json.title;
				$scope.detailBody = json.body;

				// Full list of configuration options available at:
				// https://github.com/hakimel/reveal.js#configuration
				Reveal.initialize({
					controls: true,
					progress: true,
					history: true,
					center: true,

					transition: 'slide', // none/fade/slide/convex/concave/zoom

					// Optional reveal.js plugins
					dependencies: [
						{ src: 'lib/js/classList.js', condition: function() { return !document.body.classList; } },
						{ src: 'plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
						{ src: 'plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
						{ src: 'plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
						{ src: 'plugin/zoom-js/zoom.js', async: true },
						{ src: 'plugin/notes/notes.js', async: true }
					]
				});
			});
		}
	});
});
