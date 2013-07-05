What is SplitsBrowser.HTML5?
----------------------------

This is an attempt to port the existing SplitsBrowser Java applet (available at
http://www.splitsbrowser.org.uk/) to HTML5/JavaScript/CSS.

What is it?
-----------

SplitsBrowser is a way of viewing orienteering results.

Why write it?
-------------
The main reason was to replace the existing SplitsBrowser Java applet.  There
are a number of issues with the way this works:

* You need to install Java for the SplitsBrowser Java applet to work.  No such
  requirement is true for SplitsBrowser.HTML5 - all you need is a modern web
  browser.
  
* You also need to keep Java updated.  Some browsers can refuse to run the
  applet if Java on your computer is out of date.
  
* Browser functionality has come on a long way since 
There is no longer the need for a Java applet or other such plugin to achieve
  the functionality of drawing graphs on the screen.  (There was a need to use
  such a plugin when SplitsBrowser was first released, however.)

* There have been a number of security incidents involving Java, and various
  agencies have recommended that Java be disabled.  See, for example,
  
  http://www.forbes.com/sites/eliseackerman/2013/01/11/us-department-of-homeland-security-calls-on-computer-users-to-disable-java/

* It seemed a fun thing to do, and I could learn how to use the JavaScript
  data-visualisation tool D3 (http://d3js.org).
  

What web browsers work with SplitsBrowser?
------------------------------------------

SplitsBrowser depends on D3 (http://d3js.org), and as such it supports the same
browsers as D3 (https://github.com/mbostock/d3/wiki#browser-support).  It
requires one of the following web browsers:

* Mozilla Firefox (latest version)
* Google Chrome (latest version)
* Internet Explorer 8 or later.
* Safari ?

SplitsBrowser requires that JavaScript is enabled in your browser.


Acknowledgements:
-----------------
* Original SplitsBrowser developers.
* Mike Bostock for D3.
* Shawnbot for Aight, which makes this tool work on Internet Explorer 8.  [when added]

