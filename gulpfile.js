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

// Generate Style Guide
// Include README.md file as the Overview page
// Generate style guide to docs/styleguide directory
gulp.task('styleguide:generate', function() {
  // Only generate documentation from style.scss, includes/**.scss, elements/**.scss, and pages/**.scss (except includes/_mixins.scss)
  return gulp.src([
  		paths.styleguide.src + '*.scss',
  		paths.styleguide.src + '**/*.scss',
  		'!' + paths.styleguide.src + '{_sg2,_sg2/*.scss,_sg2/**,_sg2/**/*.scss,_sg2/**/**/*.scss}',
  		'!' + paths.styleguide.src + 'includes/_mixins.scss'
  	])
    .pipe(styleguide.generate({
        title: 'Lucky Brand Styleguide',
        server: true,
        extraHead: '<style>body { font-family: "National","Helvetica","Arial",sans-serif; }</style>',
        rootPath: paths.styleguide.dest,
        overviewPath: 'luckybrand_v2_core/cartridge/scss/README.md'
    }))
    .pipe(gulp.dest(paths.styleguide.dest));
});

// Apply styles from Lucky Brand site to style guide
gulp.task('styleguide:applystyles', function() {
  return gulp.src(paths.styleguide.src + '*.scss')
    .pipe(sass({ errLogToConsole: true }))
    .pipe(styleguide.applyStyles())
    .pipe(gulp.dest(paths.styleguide.dest));
});

// Copy fonts and images to docs/styleguide directory
gulp.task('styleguide:static', function(){
	gulp.src([paths.styleguide.static + 'css/fonts/**'])
		.pipe(gulp.dest(paths.styleguide.dest + 'fonts'));
	gulp.src([paths.styleguide.static + 'images/**'])
		.pipe(gulp.dest(paths.styleguide.dest + 'images'));
});

gulp.task('styleguide', ['styleguide:static', 'styleguide:generate', 'styleguide:applystyles']);

gulp.task('build', ['js', 'css', 'styleguide']);

gulp.task('default', ['enable-watch-mode', 'js', 'css', 'styleguide'], function () {
	// Start watching changes and update styleguide whenever changes are detected
  	// Styleguide automatically detects existing server instance
	gulp.watch([
		paths.styleguide.src + 'includes/*.scss',
		paths.styleguide.src + '**/*.scss',
		'!' + paths.styleguide.src + 'includes/_mixins.scss'
	], ['styleguide']);
	gulp.watch(paths.css.map(function (path) {
		return path.src + '**/*.scss';
	}), ['css']);
});