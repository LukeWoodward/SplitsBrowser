module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '\n\n'
      },
      dist: {
        src: ['js/core.js', 'js/util.js', 'js/time.js', 'js/competitor.js',
              'js/age-class.js', 'js/age-class-set.js', 'js/course.js',
              'js/event.js', 'js/competitor-selection.js', 'js/csv-reader.js',
              'js/si-reader.js', 'js/input.js', 'js/competitor-listbox.js',
              'js/class-selector.js', 'js/comparison-selector.js',
              'js/statistics-selector.js', 'js/chart-type-selector.js',
              'js/chart-popup.js', 'js/chart.js', 'js/results-table.js',
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
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
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