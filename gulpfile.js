var gulp = require('gulp');
var $ = require("gulp-load-plugins")();
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var browserify = require('browserify');
var source = require('vinyl-source-stream');

// Sass
gulp.task('sass', function () {
	gulp.src('static/common/_scss/**/*.scss')
		.pipe($.plumber())
		// .pipe($.frontnote({
		// 	css: '../common/css/styleguide.css',
		// 	out: './static/styleguide'
		// }))
		.pipe($.sass({ errLogToConsole: true, includePaths: ['static/common/_scss/','node_modules/compass-mixins/lib/'], style: 'expanded' }) ) // Keep running gulp even though occurred compile error
		.pipe($.pleeease({
			autoprefixer: {
				browsers: ['last 2 versions', 'ie 9', 'ie 8']
			},
			minifier: false,
			opacity: true,
			filters: true
		}))
		.pipe($.csscomb())
		.pipe(gulp.dest('static/common/css'))
		.pipe(reload({stream:true}));
});

// Js-concat-uglify
gulp.task('js', function(){
	browserify({
		entries: ['static/common/_js/main.js']
	})
	.bundle()
	.pipe(source('main.min.js'))
	.pipe(gulp.dest('static/common/js/'));
});

// ‰æ‘œÅ“K‰»
var pngquant 	= require('imagemin-pngquant');

gulp.task('imagemin', function() {
	gulp.src(['static/common/_images/**/*.{png,jpg,gif,svg}'])
		.pipe(imagemin({
			optimizationLevel: 5,
			progressive: true,
			interlaced: true,
			use: [pngquant({
				quality: 60-80,
				speed: 1
			})]
		}))
		.pipe(notify("[images] Optimized:)"))
		.pipe(gulp.dest('./static/common/images'));
});

// Static server
gulp.task('browser-sync', function() {
	// Apache Proxy
	// browserSync({
	// 	proxy: '192.168.10.119:81'
	// });

	// Local Server
	browserSync({
		server: {
			baseDir: "./static/"
		}
	});
});

// Reload all browsers
gulp.task('bs-reload', function () {
	browserSync.reload();
});

// Task for `gulp` command

gulp.task('default',['browser-sync'], function() {
	gulp.watch('static/common/_scss/**/*.scss',['sass']);
	gulp.watch('static/common/_js/**/*.js',['js']);
	gulp.watch('static/common/_images/**/*.{png,jpg,gif,svg}',['imagemin']);
	gulp.watch("static/*.html", ['bs-reload']);
});
