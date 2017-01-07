'use strict';
var gulp = require('gulp'),
	gutil = require('gulp-util'),
	minimist = require('minimist'),
	_ = require('lodash'),
	sourcemaps = require('gulp-sourcemaps'),
	pkg = require('./package.json'),
	paths = pkg.paths,
	opts = minimist(process.argv.slice(2)),
	styleguide = require('sc5-styleguide');

require('babel-core/register');

var gif = require('gulp-if'),
	merge = require('merge-stream'),
	sass = require('gulp-sass'),
	prefix = require('gulp-autoprefixer');

gulp.task('css', function () {
	var streams = merge();
	paths.css.forEach(function (path) {
		streams.add(gulp.src(path.src + '*.scss')
			.pipe(gif(gutil.env.sourcemaps, sourcemaps.init()))
			.pipe(sass({outputStyle: 'compressed'}))
			.pipe(prefix({cascade: true, remove: false}))
			.pipe(gif(gutil.env.sourcemaps, sourcemaps.write('./')))
			.pipe(gulp.dest(path.dest)));
	});
	return streams;
});

var browserify = require('browserify'),
	buffer = require('vinyl-buffer'),
	source = require('vinyl-source-stream'),
	watchify = require('watchify'),
	xtend = require('xtend'),
	uglify = require('gulp-uglify');

var watching = false;
gulp.task('enable-watch-mode', function () {watching = true;});

gulp.task('js', function () {
	var opts = {
		entries: './' + paths.js.src + 'app.js', // browserify requires relative path
		debug: gutil.env.sourcemaps
	};
	if (watching) {
		opts = xtend(opts, watchify.args);
	}
	var bundler = browserify(opts);
	if (watching) {
		bundler = watchify(bundler);
	}
	// optionally transform
	// bundler.transform('transformer');

	bundler.on('update', function (ids) {
		gutil.log('File(s) changed: ' + gutil.colors.cyan(ids));
		gutil.log('Rebundling...');
		rebundle();
	});

	bundler.on('log', gutil.log);

	function rebundle () {
		return bundler.bundle()
			.on('error', function (e) {
				gutil.log('Browserify Error', gutil.colors.red(e));
			})
			.pipe(source('app.js'))
			// sourcemaps
				.pipe(buffer())
				.pipe(uglify({ ie_proof : true }))
				.pipe(sourcemaps.init({loadMaps: true}))
				.pipe(sourcemaps.write('./'))
			//
			.pipe(gulp.dest(paths.js.dest));
	}
	return rebundle();
});

var eslint = require('gulp-eslint');
gulp.task('lint', function() {
	return gulp.src('./**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

var webdriver = require('gulp-webdriver');
gulp.task('test:application', function () {
	return gulp.src('test/application/webdriver/wdio.conf.js')
		.pipe(webdriver(_.omit(opts, '_')));
});

var gulpMocha = require('gulp-mocha');
gulp.task('test:unit', function () {
	var reporter = opts.reporter || 'spec';
	var timeout = opts.timeout || 10000;
	var suite = opts.suite || '*';
	return gulp.src(['test/unit/' + suite + '/**/*.js'], {read: false})
		.pipe(gulpMocha({
			reporter: reporter,
			timeout: timeout
		}));
});

gulp.task('build', ['js', 'css']);

//'js-plugins',
gulp.task('watch', ['enable-watch-mode', 'js', 'css'], function () {
  //gulp.watch(paths.sprites.src, ['sprites']);
  gulp.watch('scss/*.scss', ['css']);
  gulp.watch('js/*.js', ['js']);
});
