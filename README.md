What is SplitsBrowser?
======================

This is an attempt to port the existing SplitsBrowser Java applet (available at
http://www.splitsbrowser.org.uk/) to HTML5/JavaScript/CSS/SVG.

SplitsBrowser is a tool to view and analyse orienteering results.  It plots a
graph that shows you where on your course you were faster or slower than others
and at which controls you lost time.

Why write it?
-------------

SplitsBrowser was originally a Java applet.  This presents a number of issues:

* You need to install Java.
  
* You also need to keep Java updated.  Some browsers can refuse to run the
  applet if Java on your computer is out of date.
  
* Browser functionality has come on a long way since Java applets were first
  introduced.  There is no longer the need for a Java applet or other such
  plugin to achieve the functionality of drawing graphs on the screen.

* There have been a number of security incidents involving Java, and various
  agencies have recommended that Java plugins in browsers be disabled.  See,
  for example,
  
  http://www.forbes.com/sites/eliseackerman/2013/01/11/us-department-of-homeland-security-calls-on-computer-users-to-disable-java/

* It seemed a fun thing to do, and I could learn how to use the JavaScript
  data-visualisation library D3 (http://d3js.org).

SplitsBrowser requires JavaScript to be enabled in your browser, but so do many
other websites these days.  It doesn't require any browser plugins.
  
  
What web browsers work with SplitsBrowser?
------------------------------------------

SplitsBrowser depends on D3 (http://d3js.org), and as such it supports the same
browsers as D3 (https://github.com/mbostock/d3/wiki#browser-support).

SplitsBrowser works with 'modern' browsers such as the latest Firefox, Chrome
or Opera, Internet Explorer 9 or later, or Edge.  It will not work in Internet
Explorer 8 or earlier.

It may also work on Safari on Mac, or on tablet browsers.  I haven't tested it,
on these platforms, though.
