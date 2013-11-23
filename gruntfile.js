/*
 *  SplitsBrowser - Grunt configuration.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n\n',
        stripBanners: true
      },
      dist: {
        src: ['js/core.js',
              'js/util.js',
              'js/time.js',
              'js/competitor.js',
              'js/age-class.js',
              'js/age-class-set.js',
              'js/course.js',
              'js/event.js',
              'js/chart-types.js',
              'js/competitor-selection.js',
              'js/csv-reader.js',
              'js/si-reader.js',
              'js/input.js',
              'js/competitor-listbox.js',
              'js/class-selector.js',
              'js/comparison-selector.js',
              'js/statistics-selector.js',
              'js/chart-type-selector.js',
              'js/chart-popup.js',
              'js/chart.js',
              'js/results-table.js',
              'js/viewer.js'],
        dest: '<%= pkg.name %>.js',
        nonull: true
      }
    },    
    uglify: {
      dist: {
        files: {
          '<%= pkg.name %>.min.js': ['<%= pkg.name %>.js']
        }
      }
    },
    qunit: {
      files: ['qunit-tests.html', 'qunit-tests-min.html']
    },
    jshint: {
      files: ['gruntfile.js', 'js/*.js', 'test/*-test.js'],
      options: {
        // options here to override JSHint defaults
        plusplus: true,
        eqeqeq: true,
        undef: true,
        unused: true,
        camelcase: true,
        curly: true,
        es3: true,
        forin: true,
        immed: true,
        globals: {
          "$": false,
          d3: false,
          window: false,
          document: false,
          setTimeout: false,
          clearTimeout: false,
          alert: false,
          SplitsBrowser: true,
          
          // QUnit globals
          QUnit: false,
          module: false,
          expect: false,
          
          // Test namespace.
          SplitsBrowserTest: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'qunit']);

};