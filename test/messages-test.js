/*
 *  Messages Tests - Tests for the messages.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward.
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
(function () {
    "use strict";
    
    module("Messages");
    
    var alerterCalled = false;

    function setAlerter() {
        alerterCalled = false;
        SplitsBrowser.setMessageAlerter(function () { alerterCalled = true; });
    }
    
    QUnit.test("Can look up a test message that exists", function (assert) {
        setAlerter();
        SplitsBrowser.Messages.TestMessage = "This is a test";
        assert.strictEqual(SplitsBrowser.getMessage("TestMessage"), SplitsBrowser.Messages.TestMessage);
        assert.ok(!alerterCalled, "Alerter should not have been called");
    });
    
    QUnit.test("Cannot look up a message that does not exist", function (assert) {
        setAlerter();
        SplitsBrowser.getMessage("ThisMessageDoesNotExist");
        assert.ok(alerterCalled, "Alerter should have been called for non-existent message");
    });
    
    QUnit.test("Can look up a test message that exists and apply formatting", function (assert) {
        setAlerter();
        SplitsBrowser.Messages.TestMessage = "This is $$ONE$$ test $$TWO$$";
        var result = SplitsBrowser.getMessageWithFormatting("TestMessage", {"$$ONE$$": "one", "$$TWO$$": "two"});
        assert.strictEqual(result, "This is one test two");
        assert.ok(!alerterCalled, "Alerter should not have been called");
    });
    
    QUnit.test("Can look up a test message that exists and apply formatting, replacing the same parameter name twice", function (assert) {
        setAlerter();
        SplitsBrowser.Messages.TestMessage = "This is $$ONE$$ test $$ONE$$";
        var result = SplitsBrowser.getMessageWithFormatting("TestMessage", {"$$ONE$$": "one"});
        assert.strictEqual(result, "This is one test one");
        assert.ok(!alerterCalled, "Alerter should not have been called");
    });
    
    QUnit.test("Can try to get a test message that exists", function (assert) {
        setAlerter();
        SplitsBrowser.Messages.TestMessage = "This is a test";
        assert.strictEqual(SplitsBrowser.tryGetMessage("TestMessage"), SplitsBrowser.Messages.TestMessage);
        assert.ok(!alerterCalled, "Alerter should not have been called");
    });
    
    QUnit.test("Can try to get a message that does not exist with the default being returned instead", function (assert) {
        setAlerter();
        assert.strictEqual(SplitsBrowser.tryGetMessage("ThisMessageDoesNotExist", "DefaultValue"), "DefaultValue");
        assert.ok(!alerterCalled, "Alerter should not have been called for tryGetMessage with non-existent message");
    });
    
})();