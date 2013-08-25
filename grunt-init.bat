@echo off

if not exist node_modules mkdir node_modules
rename package.json package.json.not
call npm install grunt-contrib-qunit
call npm install grunt-contrib-uglify
call npm install grunt-contrib-jshint
call npm install grunt-contrib-concat
rename package.json.not package.json