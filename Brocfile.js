'use strict';

const TASKS = {
  build: 'build',
  serve: 'serve'
}

const BUILDING = process.argv.indexOf(TASKS.build) > 0;
const SERVING = process.argv.indexOf(TASKS.serve) > 0;

// Parse --port cli argument
var port = +process.argv.join('').split(/--port=?/)[1] || 4200;

var Funnel = require('broccoli-funnel'); // Filter trees
var MergeTrees = require('broccoli-merge-trees'); // Merge trees
var Sass = require('broccoli-sass'); // SASS compiler
var Sync = require('broccoli-browser-sync-bv'); // BrowserSync
var AssetRev = require('broccoli-asset-rev'); // Assets Revision
var concat = require('broccoli-concat'); // Concatenate trees
var babel = require('broccoli-babel-transpiler'); // Babel transpiler
var uglify = require('broccoli-uglify-sourcemap'); // UglifyJS
var watchify = require('broccoli-watchify'); // Watchify
var autoprefixer = require('broccoli-autoprefixer'); // Autoprefixer
var ImageMin = require('broccoli-image-min'); // Imagemin

var srcDir = 'src';
var sassDir = srcDir + '/scss';
var jsDir = srcDir + '/js';

// Transpile the source files
var scripts = babel(jsDir);

// And process them through browserify
scripts = watchify(scripts, {
  browserify: {
    entries: ['index.js'],
    paths: ['.', __dirname + '/node_modules'],
  },
  outputFile: 'static/js/script.js',
});

if (BUILDING) {
  scripts = uglify(scripts, {
    mangle: {
      except: ['global']
    }
  });
}

// Grab legacy scripts in particular order
// var legacyFiles = [
//   'scrollreveal/dist/scrollreveal.js',
// ];

// if (legacyFiles.length) {
//   var legacyJs = new Funnel('node_modules', {
//     files: legacyFiles
//   });

//   legacyJs = concat(legacyJs, {
//     // inputFiles: ['**/*.js'],
//     headerFiles: legacyFiles,
//     outputFile: 'static/js/legacy.js'
//   });
// }

// Compile SCSS styles
var styles = new Sass([sassDir, 'node_modules'],
  'style.scss',
  'static/css/style.css',
  {outputStyle: 'expanded'}
);

// Autoprefixer
styles = autoprefixer(styles, {
  browsers: ['last 3 versions', 'Firefox ESR', 'Safari >= 6']
});

// Grab the HTML
var html = new Funnel(srcDir, {
  // files: ['index.html'],
  include: ['*.html', 'favicon.ico']
});

// Grab images
var images = null;
if (BUILDING) {
  images = new ImageMin(`${srcDir}/img`, {
    include: ['**/*.{jpg,png}'],
    destination: 'static/img'
  });
} else {
  images = new Funnel(srcDir, {
    srcDir: 'img',
    destDir: 'static/img',
    allowEmpty: true,
  });
}

// Grab share
var share = new Funnel(srcDir, {
  srcDir: 'share',
  destDir: 'static/share',
  allowEmpty: true,
});

// Grab fonts
var fonts = new Funnel(srcDir, {
  srcDir: 'fonts',
  destDir: 'static/fonts',
  allowEmpty: true,
});

var treesToMerge = [
  html,
  scripts,
  styles,
  images,
  share,
  fonts,
];

var output = new MergeTrees(treesToMerge);

if (BUILDING) {
  output = new AssetRev(output, {
    extensions: ['js', 'css', 'png', 'jpg', 'gif'],
    replaceExtensions: ['html', 'js', 'css'],
    exclude: ['share/fb.jpg', 'share/vk.jpg'],
  });
} else if (SERVING) {
  // Set up live reloading via BrowserSync
  var browserSync = new Sync([html, scripts, styles, images, share, fonts], {
    port: port,
    browserSync: {
      port: 9000,
      open: false,
      ghostMode: false,
      notify: false
    }
  });

  output = new MergeTrees([
    output,
    browserSync
  ]);
}

// Grab all our trees and
// export them as a single and final tree
module.exports = output;
