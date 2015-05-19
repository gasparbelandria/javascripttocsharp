﻿/// <reference path="jquery.js" />
/*
 ww.jQuery.js  
 West Wind jQuery plug-ins and utilities

 Copyright (c) 2008 Rick Strahl, West Wind Technologies 
 www.west-wind.com

 Licensed under MIT License
 http://en.wikipedia.org/wiki/MIT_License

 Version 0.90.45
*/

//(function($) {

this.HttpClient = function(opt) {
    var _I = this;

    this.completed = null;
    this.errorHandler = null;
    this.errorMessage = "";
    this.async = true;
    this.evalResult = false;
    this.isMsAjaxJson = false;
    this.contentType = "application/x-www-form-urlencoded";
    this.method = "GET";
    this.timeout = 20000;
    this.headers = {};

    $.extend(_I, opt);

    this.appendHeader = function(header, value) {
        _I.headers[header] = value;
    }
    this.send = function(url, postData, completed, errorHandler) {
        completed = completed || _I.completed;
        errorHandler = errorHandler || _I.errorHandler;

        $.ajax(
 { url: url,
     data: postData,
     type: (postData ? "POST" : _I.method),
     processData: false,  // always process on our own!
     contentType: _I.contentType,
     timeout: _I.timeout,
     dataType: "text",
     global: false,
     async: _I.async,
     beforeSend: function(xhr) {
         for (var header in _I.headers) xhr.setRequestHeader(header, _I.headers[header]);
     },
     success: function(result, status) {
         var errorException = null;
         if (_I.evalResult) {
             try {
                 result = JSON.parse(result);
                 if (result != null) {
                     if (result.d && result.d.__type)
                         result = result.d;
                     if (_I.isMsAjaxJson) {
                         // Wrapped message: return first property
                         for (var property in result) {
                             result = result[property];
                             break;
                         }
                     }
                 }
             }
             catch (e) { errorException = new CallbackException(e); }
         }
         if (errorException) {
             if (errorHandler)
                 errorHandler(errorException, _I);
             return;
         }
         if (result && result.isCallbackError) {
             if (errorHandler)
                 errorHandler(result, _I);
         }
         if (completed)
             completed(result, _I);
     },
     error: function(xhr, status) {
         var result = xhr.responseText;
         var error = null;

         if (xhr.status != 200) {
             if (result && result.charAt(0) == '{')
                 error = JSON.parse(result);
             else
                 error = new CallbackException(xhr.statusText);
         }

         if (errorHandler)
             errorHandler(error, _I, xhr);
     }
 }); // $.ajax
    }
    this.returnError = function(message) {
        var error = new CallbackException(message);
        if (_I.errorHandler)
            _I.errorHandler(error, _I);
    }
}

// Generic Service Proxy class that can be used to 
// call JSON Services generically using jQuery
// Depends on JSON2 modified for MS Ajax usage
this.ServiceProxy = function(serviceUrl) {
    var _I = this;
    this.serviceUrl = serviceUrl;

    // Call a wrapped object
    this.invoke = function(method, data, callback, errorCallback, isBare) {
        // Convert input data into JSON using internal code
        var json = JSON.serialize(data);

        // The service endpoint URL MyService.svc/       
        var url = _I.serviceUrl + "/" + method;

        var http = new HttpClient({ contentType: "application/json",
            evalResult: true,
            isMsAjaxJson: !isBare
        });
        http.send(url, json, callback, errorCallback);
    }
}
// Create a static instance
//var proxy = new ServiceProxy("JsonStockService.svc/");


this.AjaxMethodCallback = function(controlId, url, opt) {
    var _I = this;

    this.method = "";
    this.controlId = controlId;
    this.postbackMode = "PostMethodParametersOnly";  // Post,PostNoViewState,Get
    parameterMode = "Post";  // post,json,msajax
    this.serverUrl = url;
    this.formName = null;
    this.resultMode = "json";  // json,msajax,string

    this.completed = null;
    this.errorHandler = null;
    $.extend(this, opt);

    this.Http = null;

    this.callMethod = function(methodName, parameters, callback, errorCallback) {
        _I.completed = callback;
        _I.errorHandler = errorCallback;

        http = new HttpClient(); _I.Http = http;

        if (_I.resultMode == "json")
            http.evalResult = true;
        else if (_I.resultMode == "msajax") {
            http.evalResult = true;
            http.isMsAjax = true;
        }
        // else {}   string doesn't eval - just return the response

        var Data = {};
        var parmCount = 0;
        if (parameters.length) {
            parmCount = parameters.length;
            for (var x = 0; x < parmCount; x++) {
                Data["Parm" + (x + 1).toString()] = JSON.serialize(parameters[x]);
            }
        }

        $.extend(Data, { CallbackMethod: methodName,
            CallbackParmCount: parmCount,
            __WWEVENTCALLBACK: _I.controlId
        });

        Data = $.param(Data) + "&"

        var formName = _I.formName || document.forms[0];

        if (_I.postbackMode == "Post")
            Data += $("#" + formName).serialize();
        else if (_I.postbackMode == "PostNoViewstate")
            Data += $().serializeNoViewState();
        else if (this.postbackMode == "Get") {
            Url = this.serverUrl;
            if (Url.indexOf('?') > -1)
                Url += Data;
            else
                Url += "?" + Data;

            return http.send(Url, null, _I.onHttpCallback, _I.onHttpCallback);
        }

        return http.send(this.serverUrl, Data, _I.onHttpCallback, _I.onHttpCallback);
    }

    this.onHttpCallback = function(result) {
        if (result && result.isCallbackError) {
            if (_I.errorHandler)
                _I.errorHandler(result, _I);
            return;
        }
        if (_I.completed != null)
            _I.completed(result, _I);
    }
}

this.CallbackException = function(message) {
    this.isCallbackError = true;
    if (typeof (message) == "object" && message.message)
        this.message = message.message;
    else
        this.message = message;
}


//Copyright (c) 2005 JSON.org
//Modifications by Rick Strahl
//Added dates in object parser,} and ] encoding
this.JSON = {
    copyright: '(c)2005 JSON.org',
    license: 'http://www.crockford.com/JSON/license.html',
    serialize: function(v) {
        var a = [];
        //	Emit a string.
        function e(s) {
            a[a.length] = s;
        }

        // Convert a value.
        function g(x) {
            var b, c, i, l, v;

            switch (typeof x) {
                case 'string':

                    e('"');
                    if (/["\\\x00-\x1f\x7d\x5d]/.test(x)) {
                        l = x.length;
                        for (i = 0; i < l; i += 1) {
                            c = x.charAt(i);
                            if (c >= ' ' && c != '}' && c != ']') {
                                if (c == '\\' || c == '"')
                                    e('\\');
                                e(c);
                            } else {
                                switch (c) {
                                    case '\b':
                                        e('\\b');
                                        break;
                                    case '\f':
                                        e('\\f');
                                        break;
                                    case '\n':
                                        e('\\n');
                                        break;
                                    case '\r':
                                        e('\\r');
                                        break;
                                    case '\t':
                                        e('\\t');
                                        break;
                                    case '}':
                                        e('\\u007D');
                                        break;
                                    case ']':
                                        e('\\u005D');
                                        break;
                                    default:
                                        c = c.charCodeAt();
                                        e('\\u00' +
		Math.floor(c / 16).toString(16) +
		(c % 16).toString(16));
                                }
                            }
                        }
                    } else {
                        e(x);
                    }
                    e('"');
                    return;
                case 'number':
                    e(isFinite(x) ? x : 'null');
                    return;
                case 'object':
                    if (x) {
                        // RAS: Added Date Parsing
                        if (x.toUTCString)
                            return e('\"\\/Date(' + x.getTime() + ')\\/\"'); // MS Ajax style
                        //return e('new Date(' + x.getTime() + ')' );

                        if (x instanceof Array) {
                            e('[');
                            l = a.length;
                            for (i = 0; i < x.length; i += 1) {
                                v = x[i];
                                if (typeof v != _ud &&
		typeof v != 'function') {
                                    if (b) {
                                        e(',');
                                    }
                                    g(v);
                                    b = true;
                                }
                            }
                            e(']');
                            return;
                        } else if (typeof x.valueOf == 'function') {
                            e('{');
                            l = a.length;
                            for (i in x) {
                                v = x[i];
                                if (typeof v != _ud &&
		typeof v != 'function' &&
		(!v || typeof v != 'object' ||
		typeof v.valueOf == 'function')) {
                                    if (b) {
                                        e(',');
                                    }
                                    g(i);
                                    e(':');
                                    g(v);
                                    b = true;
                                }
                            }
                            return e('}');
                        }
                    }
                    e('null');
                    return;
                case 'boolean':
                    e(x);
                    return;
                default:
                    e('null');
                    return;
            }
        }
        g(v);
        return a.join('');
    },
    // *** RAS Update: RegEx handler for dates ISO and MS AJAX style
    regExDate: function(str, p1, p2, offset, s) {
        str = str.substring(1).replace('"', '');
        var date = str;
        //MS Ajax date
        var regEx = /\/Date(.*)\//;
        if (regEx.test(str)) {
            str = str.match(/Date\((.*?)\)/)[1];
            date = "new Date(" + parseInt(str) + ")";
        }
        else { // ISO Date 2007-12-31T23:59:59Z                                     
            var matches = str.split(/[-,:,T,Z]/);
            matches[1] = (parseInt(matches[1], 0) - 1).toString();
            date = "new Date(Date.UTC(" + matches.join(",") + "))";
        }
        return date;
    },
    parse: function(text, noCheck) {

        if (!noCheck && !(!(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
 text.replace(/"(\\.|[^"\\])*"/g, '')))))
            throw new Error("Invalid characters in JSON parse string.");

        // *** RAS Update:  Fix up Dates: ISO and MS AJAX format support
        var regEx = /(\"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*?\")|(\"\\*\/Date\(.*?\)\\*\/")/g;
        //var regEx = /(\"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*?\")|(\"\\\/Date\(.*?\)\\\/")/g;
        text = text.replace(regEx, this.regExDate);

        return eval('(' + text + ')');
    },
    parseSafe: function(text) {
        try { return this.parse(text); } catch (e) { return null; }
    }
}

this.StatusBar = function(sel, options) {
    var _I = this;
    var _sb = null;

    // options     
    this.elementId = "_showstatus";
    this.prependMultiline = true;
    this.showCloseButton = false;
    this.afterTimeoutText = null;

    this.cssClass = "statusbar";
    this.highlightClass = "statusbarhighlight";
    this.errorClass = "statuserror";
    this.closeButtonClass = "statusbarclose";
    this.additive = false;

    $.extend(this, options);

    if (sel)
        _sb = $(sel);

    // create statusbar object manually
    if (!_sb) {
        _sb = $("<div id='_statusbar' class='" + _I.cssClass + "'>" +
"<div class='" + _I.closeButtonClass + "'>" +
(_I.showCloseButton ? " X </div></div>" : ""))
 .appendTo(document.body)
 .show();
    }
    if (_I.showCloseButton)
        $("." + _I.cssClass).click(function(e) { $(_sb).hide(); });


    this.show = function(message, timeout, isError) {
        if (_I.additive) {
            var html = "<div style='margin-bottom: 2px;' >" + message + "</div>";
            if (_I.prependMultiline)
                _sb.prepend(html);
            else
                _sb.append(html);
        }
        else {

            if (!_I.showCloseButton)
                _sb.text(message);
            else {
                var t = _sb.find("div.statusbarclose");
                _sb.text(message).prepend(t);
            }
        }

        _sb.show();

        if (timeout) {
            if (isError)
                _sb.addClass(_I.errorClass);
            else
                _sb.addClass(_I.highlightClass);

            setTimeout(
function() {
    _sb.removeClass(_I.highlightClass);
    if (_I.afterTimeoutText)
        _I.show(_I.afterTimeoutText);
},
 timeout);
        }
    }
    this.hide = function() {
        _sb.hide();
    }
    this.release = function() {
        if (_statusbar)
            $(_statusbar).remove();
    }
}
// use this as a global instance to customize constructor
// or do nothing and get a default status bar
var __statusbar = null;
this.showStatus = function(message, timeout, additive, isError) {

    if (!__statusbar)
        __statusbar = new StatusBar();
    __statusbar.show(message, timeout, additive, isError);
}


$.fn.centerInClient = function(options) {
    /// <summary>Centers the selected items in the browser window. Takes into account scroll position.
    /// Ideally the selected set should only match a single element.
    /// </summary>    
    /// <param name="fn" type="Function">Optional function called when centering is complete. Passed DOM element as parameter</param>    
    /// <param name="forceAbsolute" type="Boolean">if true forces the element to be removed from the document flow 
    ///  and attached to the body element to ensure proper absolute positioning. 
    /// Be aware that this may cause ID hierachy for CSS styles to be affected.
    /// </param>
    /// <returns type="jQuery" />
    var opt = { forceAbsolute: false,
        container: window,    // selector of element to center in
        completed: null
    };
    $.extend(opt, options);

    return this.each(function(i) {
        var el = $(this);
        var jWin = $(opt.container);
        var isWin = opt.container == window;

        // force to the top of document to ENSURE that 
        // document absolute positioning is available
        if (opt.forceAbsolute) {
            if (isWin)
                el.remove().appendTo("body");
            else
                el.remove().appendTo(jWin.get(0));
        }

        // have to make absolute
        el.css("position", "absolute");

        // height is off a bit so fudge it
        var heightFudge = 2.2;

        var x = (isWin ? jWin.width() : jWin.outerWidth()) / 2 - el.outerWidth() / 2;
        var y = (isWin ? jWin.height() : jWin.outerHeight()) / heightFudge - el.outerHeight() / 2;

        el.css({ left: x + jWin.scrollLeft(), top: y + jWin.scrollTop() });

        var zi = el.css("zIndex");
        if (!zi || zi == "auto")
            el.css("zIndex", 1);

        // if specified make callback and pass element
        if (opt.completed)
            opt.completed(this);
    });
}

$.fn.moveToMousePosition = function(evt, options) {
    var opt = { offsetLeft: 0,
        offsetTop: 0
    };
    $.extend(opt, options);
    return this.each(function() {
        var el = $(this);
        el.css({ left: evt.pageX + opt.offsetLeft,
            top: evt.pageY + opt.offsetTop,
            position: "absolute"
        });
    });
}

$.fn.shadow = function(action, options, refreshOnly) {
    /// <summary>
    /// Applies a drop shadow to an element by 
    /// underlaying a <div> underneath the element(s)
    ///
    /// Note the shadow is not locked to the element
    /// so if the element is moved the shadow needs
    /// to be reapplied.    
    /// </summary>    
    /// <param name="action" type="string">
    /// optional - hide, remove
    /// can also be the options parameter if action is omitted
    /// </param>    
    /// <param name="options" type="object">
    /// optional parameters.
    ///    offset: 6,
    ///    color: "black",
    ///    opacity: .25,
    ///    callback: null,
    ///    zIndex: 100,
    ///    track: false       
    /// </param>    
    /// <returns type="jQuery" /> 
    if (typeof action == "object")
        options = action;

    var opt = { offset: 8,
        color: "black",
        opacity: 0.25,
        callback: null,
        zIndex: 100,
        track: false
    };
    $.extend(opt, options);

    this.each(function() {
        var el = $(this);
        var sh = $("#" + el.get(0).id + "Shadow");

        if (typeof action == "string") {
            if (action == "hide" || action == "remove")
                sh.unwatch("_shadowMove").remove();
            return;
        }

        var exists = true;
        if (sh.length < 1) {
            sh = $("<div id='" + el.get(0).id + "Shadow' style='height: 1px; width: 1px;'></div>")
                        .insertAfter(el);

            var zi = el.css("zIndex");
            if (!zi || zi == "auto") {
                el.css("zIndex", opt.zIndex);
                sh.css("zIndex", opt.zIndex - 1);
            }

            var shEl = sh.get(0);
            if (typeof shEl.style.filter == "string") {
                shEl.style.filter = 'progid:DXImageTransform.Microsoft.Blur(makeShadow=1, shadowOpacity=' + opt.opacity.toString() + ', pixelRadius=3)';
                opt.offset = opt.offset - 4;
            }
            exists = false;
        }

        var vis = el.is(":visible");
        if (!vis)
            el.show();  // must be visible to get .position

        var pos = el.position();

        sh.show()
          .css({ position: "absolute",
              width: el.outerWidth(),
              height: el.outerHeight(),
              opacity: opt.opacity,
              background: opt.color,
              left: pos.left + opt.offset,
              top: pos.top + opt.offset
          })
       .css("-moz-border-radius", "0px 1px 2px 1px")
       .css("-webkit-border-radius", "3px");

        if (!vis) {
            el.hide();
            sh.hide();
        }

        zIndex = el.css("zIndex");
        if (zIndex && zIndex != "auto")
            sh.css("zIndex", zIndex - 1);

        if (!exists) {
            el.watch("left,top,width,height,display,opacity,zIndex",
     function(w, i) {
         if (el.is(":visible")) {
             $(this).shadow(opt);
             sh.css("opacity", el.css("opacity") * opt.opacity);
         }
         else
             sh.hide();
     },
100, "_shadowMove");
        }

        if (opt.callback)
            opt.callback(sh);
    });
    return this;
}

$.fn.tooltip = function(msg, timeout, options) {
    var opt = { cssClass: "",
        isHtml: false,
        onRelease: null
    };
    $.extend(opt, options);

    return this.each(function() {
        var tt = new ToolTip(this, opt);
        if (msg == "Hide") {
            tt.hide();
            return;
        }
        tt.show(msg, timeout, opt.isHtml);
    });

    function ToolTip(sel, opt) {
        var _I = this;
        var jEl = $(sel);
        var tt = null;

        this.cssClass = "";
        this.onRelease = null;
        $.extend(_I, opt);

        this.show = function(msg, timeout, isHtml) {
            var el = jEl.get(0);
            tt = $("#" + el.id + "_ToolTip");
            if (tt.length > 0)
                tt.remove();

            tt = $("<div></div>");
            tt.get(0).id = el.id + "_tt";
            $(document.body).append(tt);

            tt.css({
                position: "absolute",
                display: "none",
                zIndex: 1000
            });
            if (_I.cssClass)
                tt.addClass(_I.cssClass);
            else
                tt.css({
                    background: "cornsilk",
                    border: "solid 1px gray",
                    fontSize: "8pt",
                    padding: 2
                });

            if (isHtml)
                tt.html(msg);
            else
                tt.text(msg);

            var pos = jEl.position();

            var Left = pos.left + 5;
            var Top = pos.top + jEl.height() - 2;

            var Width = tt.width();
            if (Width > 400)
                Width = 400;

            tt.css({ left: Left,
                top: Top,
                width: Width
            });
            tt.show();
            tt.shadow({ offset: 2 });

            if (timeout && timeout > 0)
                setTimeout(function() {
                    if (_I.onRelease)
                        _I.onRelease.call(_I);
                    _I.hide.call(_I);
                }, timeout);
        }
        this.hide = function() {
            tt.fadeOut("slow");
        }
    }
}



$.fn.watch = function(props, func, interval, id) {
    /// <summary>
    /// Allows you to monitor changes in a specific
    /// CSS property of an element by polling the value.
    /// when the value changes a function is called.
    /// The function called is called in the context
    /// of the selected element (ie. this)
    /// </summary>    
    /// <param name="prop" type="String">CSS Properties to watch sep. by commas</param>    
    /// <param name="func" type="Function">
    /// Function called when the value has changed.
    /// </param>    
    /// <param name="interval" type="Number">
    /// Optional interval for browsers that don't support DOMAttrModified or propertychange events.
    /// Determines the interval used for setInterval calls.
    /// </param>
    /// <param name="id" type="String">A unique ID that identifies this watch instance on this element</param>  
    /// <returns type="jQuery" /> 
    if (!interval)
        interval = 200;
    if (!id)
        id = "_watcher";

    return this.each(function() {
        var _t = this;
        var el = $(this);
        var fnc = function() { __watcher.call(_t, id) };
        var itId = null;

        if (typeof (this.onpropertychange) == "object")
            el.bind("propertychange." + id, fnc);
        else if ($.browser.mozilla)
            el.bind("DOMAttrModified." + id, fnc);
        else
            itId = setInterval(fnc, interval);

        var data = { id: itId,
            props: props.split(","),
            func: func,
            vals: [props.split(",").length]
        };
        $.each(data.vals, function(i) { data.vals[i] = el.css(data.props[i]); });
        el.data(id, data);
    });

    function __watcher(id) {
        var el = $(this);
        var w = el.data(id);

        var changed = false;
        var i = 0;
        for (i; i < w.props.length; i++) {
            var newVal = el.css(w.props[i]);
            if (w.vals[i] != newVal) {
                w.vals[i] = newVal;
                changed = true;
                break;
            }
        }
        if (changed && w.func) {
            var _t = this;
            w.func.call(_t, w, i)
        }
    }
}
$.fn.unwatch = function(id) {
    this.each(function() {
        var w = $(this).data(id);
        var el = $(this);
        el.removeData();

        if (typeof (this.onpropertychange) == "object")
            el.unbind("propertychange." + id, fnc);
        else if ($.browser.mozilla)
            el.unbind("DOMAttrModified." + id, fnc);
        else
            clearInterval(w.id);
    });
    return this;
}


$.fn.listSetData = function(items, options) {
    var opt = { noClear: false,        // don't clear the list first if true
        dataValueField: null,  // optional value field for object lists
        dataTextField: null
    };
    $.extend(opt, options);

    return this.each(function() {
        var el = $(this);

        if (items == null)
            return;

        if (!opt.noClear)
            el.listClear();

        if (items.Rows)
            items = items.Rows;

        var IsValueList = false;

        if (!opt.dataTextField && !opt.dataValueField)
            IsValueList = true;

        for (x = 0; x < items.length; x++) {
            var row = items[x];
            if (IsValueList)
                el.listAddItem(row, row);
            else
                el.listAddItem(row[opt.dataTextField], row[opt.dataValueField]);
        }
    });
}
$.fn.listAddItem = function(text, value) {
    return this.each(function() {
        $(this).append("<option value=\"" + value + "\">" + text + "</option>");
    });
}
$.fn.listClear = function() {
    return this.each(function() {
        $(this).children().remove();
    });
}


this.HoverPanel = function(sel, opt) {
    var _I = this;
    var jEl = $(sel);
    var el = jEl.get(0);

    var busy = -1;
    var lastMouseTop = 0;
    var lastMouseLeft = 0;

    this.serverUrl = "";
    this.htmlTargetId = el.id;
    this.queryString = "";
    this.eventHandlerMode = "ShowHtmlAtMousePosition";
    this.postbackMode = "Get";
    this.completed = null;
    this.callbackErrorHandler = null;
    this.hoverOffsetRight = 0;
    this.hoverOffsetBottom = 0;
    this.panelOpacity = 1;
    this.shadowOffset = 0;
    this.shadowOpacity = 0.25;
    this.adjustWindowPosition = true;
    this.formName = "";
    this.navigateDelay = 0;
    this.http = null;
    $.extend(_I, opt);

    this.startCallback = function(e, queryString, postData, errorHandler) {
        try {
            var key = new Date().getTime();
            _I.busy = key;

            var Url = this.serverUrl;
            if (e) {
                _I.lastMouseTop = e.clientY;
                _I.lastMouseLeft = e.clientX;
            }
            else
                _I.lastMouseTop = 0;

            if (queryString == null)
                _I.queryString = queryString = "";
            else
                _I.queryString = queryString;

            if (errorHandler)
                _I.callbackErrorHandler = errorHandler;

            if (queryString)
                queryString += "&";
            else
                queryString = "";
            queryString += "__WWEVENTCALLBACK=" + _I.controlId;

            _I.formName = _I.formName || document.forms[0];

            _I.http = new HttpClient();
            _I.http.appendHeader("RequestKey", key);

            if (postData)
                postData += "&";

            if (_I.postbackMode == "Post")
                postData += $(_I.formName).serialize();
            else if (this.postbackMode == "PostNoViewstate")
                postData += $(_I.formName).serializeNoViewState();
            else if (this.postbackMode == "Get" && postData)
                queryString += postData;

            if (queryString != "") {
                if (Url.indexOf("?") > -1)
                    Url = Url + "&" + queryString
                else
                    Url = Url + "?" + queryString;
            }

            if (_I.eventHandlerMode == 'ShowIFrameAtMousePosition' ||
                _I.eventHandlerMode == 'ShowIFrameInPanel') {
                setTimeout(function() { if (_I.busy) _I.showIFrame.call(_I, Url); }, _I.navigateDelay);
                return;
            }

            // *** Send the request with navigate delay
            setTimeout(function() {
                if (_I.busy == key)
                    _I.http.send.call(_I, Url, postData, _I.onHttpCallback, _I.onHttpCallback);
            }, _I.navigateDelay);
        }
        catch (e) {
            // *** Call with 'error message'
            _I.onHttpCallback(new CallbackException(e.message));
        }
    }

    this.onHttpCallback = function(result) {
        _I.busy = -1;

        if (_I.http && _I.http.status && _I.http.status != 200)
            result = new CallbackException(http.statusText);
        if (result == null)
            result = new CallbackException("No output was returned.");

        if (result.isCallbackError) {
            if (_I.callbackErrorHandler)
                _I.callbackErrorHandler(result);
            return;
        }
        _I.displayResult(result);
    }
    this.displayResult = function(result) {
        if (_I.completed && _I.completed(Result, _I) == false)
            return;
        if (_I.eventHandlerMode == "ShowHtmlAtMousePosition") {
            _I.assignContent(result);
            _I.movePanelToPosition(_I.lastMouseLeft + _I.hoverOffsetRight, _I.lastMouseTop + _I.hoverOffsetBottom);
            _I.show();
        }
        else if (_I.eventHandlerMode == "ShowHtmlInPanel") {
            _I.assignContent(result);
            _I.show();
        }
    }
    this.assignContent = function(result) {
        $(_I.htmlTargetId).html(result);
    }
    this.movePanelToPosition = function(x, y) {
        try {
            jEl.css("position", "absolute");

            if (typeof x == "object") {
                _I.lastMouseTop = x.clientY;
                _I.lastMouseLeft = x.clientX;
            }
            else if (typeof x == "number") {
                _I.lastMouseTop = y;
                _I.lastMouseLeft = x;
            }

            var x = _I.lastMouseLeft + 3;
            var y = _I.lastMouseTop + 3;
            var jWin = $(window);
            jEl.css({ left: x + jWin.scrollLeft(), top: y + jWin.scrollTop() });

            if (_I.adjustWindowPosition && document.body) {
                var mainHeight = jWin.height();
                var panHeight = jEl.outerHeight();
                var mainWidth = jWin.width();
                var panWidth = jEl.outerWidth();

                if (mainHeight < panHeight)
                    y = 0;
                else {
                    if (mainHeight < _I.lastMouseTop + panHeight)
                        y = mainHeight - panHeight - 10;
                }

                if (mainWidth < panWidth)
                    x = 0;
                else {
                    if (mainWidth < _I.lastMouseLeft + panWidth)
                        x = mainWidth - panWidth - 25;
                }
                jEl.css({ left: x + jWin.scrollLeft(), top: y + jWin.scrollTop() });
            }
        }
        catch (e)
        { window.status = 'Moving off window failed: ' + e.message; }
    }
    this.showIFrame = function(Url) {
        _I.busy = false;
        Url = Url ? Url : _I.serverUrl;
        $w(_I.controlId + '_IFrame').src = Url;
        if (_I.eventHandlerMode == "ShowIFrameAtMousePosition") {
            _I.show();
            _I.movePanelToPosition(_I.lastMouseLeft + _I.hoverOffsetRight, _I.lastMouseTop + _I.hoverOffsetBottom);
        }
        else
            _I.show();
    }
    this.hide = function() {
        this.abort();
        jEl.hide();
    }
    this.abort = function() { _I.busy = -1; }
    this.show = function() {
        jEl.show().css("opacity", _I.panelOpacity);
        if (_I.shadowOffset)
            jEl.shadow({ offset: _I.shadowOffset, opacity: _I.shadowOpacity });
    }
    this.fadeOut = function(speed) {
        jEl.fadeOut(speed);
    }
    this.fadeIn = function(speed) {
        jEl.fadeTo(Speed);
    }
}


$.fn.modalDialog = function(opt,msg,head) 
{
    if (this.length < 1)
        return this;

    // only works with a single instance
    var el =  this.get(0);
    var jEl = $(el);                    
    var dId = "modal" + el.id;
    
    var md = jEl.data(dId);
    if (!md)
       md = new ModalDialog(jEl,opt);

    if (typeof opt == "string") {
        if (opt == "hide")
            md.hide();   
        if (opt == "instance" || opt=="get")
           return md;                               
        return;
    }                   
    md.show(msg,head);                    
    jEl.data(dId,md); 
        
    return this;
}
function ModalDialog(sel, opt) {
    _I = this;
    jEl = $(sel);
    if (jEl.length < 1)
        jEl = $("#" + sel);

    this.overlayId = "_ModalOverlay";
    this.dialogId = "";
    this.contentId = jEl.get(0).id;
    this.headerId = "";
    this.backgroundOpacity = .75;
    this.fadeinBackground = false;
    this.zIndex = 10000;
    this.jOverlay = null;
    this.dialogHandler = null;
    this.keepCentered = true;
    $.extend(_I, opt);

    this.show = function(msg, head) {
        if (_I.contentId && typeof msg == "string")
            $("#" + _I.contentId).text(msg);
        if (_I.headerId && typeof head == "string")
            $("#" + _I.headerId).text(head);

        jEl.css({ zIndex: _I.zIndex + 2 });
        jEl.show().centerInClient();

        opaqueOverlay({ zIndex: _I.zIndex + 1, sel: "#" + _I.overlayId });
        _I.zIndex++;

        // *** track any clicks inside modal dialog
        jEl.click(_I.callback);

        if (_I.keepCentered)
            $(window).bind("resize.modal", function() { jEl.centerInClient() })
                         .bind("scroll.modal", function() { jEl.centerInClient() });
    }
    this.hide = function() {
        jEl.hide();
        if (_I.keepCentered)
            $(window).unbind("resize.modal")
                         .unbind("scroll.modal");
        opaqueOverlay("hide");
        jEl.unbind("click");
    }
    this.callback = function(e) {
        if (_I.dialogHandler) {
            var btn = (e.target == $("#" + _I.okButtonId).get(0)) ? 1 : 0;
            if (_I.dialogHandler.call(e.target, e, btn) == false)
                return;
            setTimeout(function() { _I.hide(); }, 1);
        }

    }
}
this.opaqueOverlay = function(opt) {
    var _I = this;
    var jWin = $(window);

    this.sel = "";
    this.opacity = 0.75;
    this.zIndex = 10000;
    $.extend(this, opt);

    var sh = sel ? $(sel) : $("qx");
    sh = sh.length > 0 ? sh : $("#_ShadowOverlay");

    if (opt == "hide") {
        if (sh.length < 1)
            return;
        sh.hide();
        sh.get(0).opaqueOverlay = false;
        jWin.unbind("resize.opaque").unbind("scroll.opaque");
        return;
    }

    if (sh.length < 1)
        sh = $("<div></div>")
                 .attr("id", "_ShadowOverlay")
                 .css("background", "black")
                 .appendTo(document.body);

    var el = sh.get(0);
    sh.show();

    if (!el.opaqueOverlay)
        jWin.bind("resize.opaque", function() { opaqueOverlay(opt); })
            .bind("scroll.opaque", function() { opaqueOverlay(opt); });

    el.opaqueOverlay = true;

    sh.css({ top: 0 + jWin.scrollTop(), left: 0 + jWin.scrollLeft(), position: "absolute", opacity: _I.opacity, zIndex: _I.zIndex })
        .width(jWin.width())
        .height(jWin.height());
    return sh;
}


if (!$.fn.draggable) {
    $.fn.draggable = function(opt) {
        return this.each(function() {
            var el = $(this);
            var drag = el.data("draggable");

            if (typeof opt == "string") {
                if (drag && opt == "Remove") {
                    drag.stopDragging();
                    el.removeData("draggable");
                }
                return;
            }

            if (!drag) {
                drag = new DragBehavior(this, opt);
                el.data("draggable", drag);
            }
        });
    }
    var __dragIndex = 1;

    function DragBehavior(sel, opt) {
        var _I = this;
        var el = $(sel);

        this.handle = "";
        this.opacity = 0.75;
        this.start = null;
        this.stop = null;
        this.dragDelay = 100;
        $.extend(_I, opt);

        this.handle = this.handle ? $(this.handle) : el;
        if (this.handle.length < 1)
            this.handle = el;

        var isMouseDown = false;
        var clicked = -1;
        var deltaX = 0;
        var deltaY = 0;
        var savedOpacity = 1;
        var savedzIndex = 0;
        
        this.mouseDown = function(e) {
            var dEl = _I.handle.get(0);
            var s = $(e.target).parents("#"+ dEl.id);
            if (isMouseDown || (e.target != dEl && s.length == 0))
                return;                                    

            el.css("position", "absolute");
            deltaX = e.originalEvent.layerX || e.originalEvent.offsetX;
            deltaY = e.originalEvent.layerY || e.originalEvent.offsetY;
            _I.dragActivate(e);
            e.stopPropagation();
        }
        this.dragActivate = function(e) {
            _I.moveToMouse(e);
            isMouseDown = true;
            savedzIndex = el.css("zIndex");
            el.css("zIndex", 50000);
            savedOpacity = el.css("opacity");
            el.css({ opacity: _I.opacity, cursor: "move" });
            var nf = function() { };
            $(document).bind("mousemove", _I.mouseMove);
            $(document).mouseup(_I.mouseUp);
            $(document).bind("selectstart", nf);
            $(document.body).bind("dragstart", nf);
            $(document.body).bind("selectstart", nf);
            _I.handle.bind("selectstart", nf);
            if (_I.start)
                _I.start(e, _I);
        }
        this.dragDeactivate = function(e, noMove) {
            isMouseDown = false;

            if (!noMove)
                _I.moveToMouse(e);
            $(document).unbind("mousemove", _I.mouseMove);
            $(document).unbind("mouseup", _I.mouseUp);

            $(document).unbind("selectstart", function() { });
            $(document.body).unbind("dragstart", function() { });
            $(document.body).unbind("selectstart", function() { });
            _I.handle.unbind("selectstart", function() { });

            if (!noMove) {
                __dragIndex += 10;
                el.css({ zIndex: 10000 + __dragIndex, cursor: "auto" });

                el.css("opacity", savedOpacity);
                if (_I.stop)
                    _I.stop(e, _I);
            }
        }
        this.mouseUp = function(e) {
            _I.dragDeactivate(e);
        }
        this.mouseMove = function(e) {
            if (isMouseDown)
                _I.moveToMouse(e);
        }
        this.moveToMouse = function(e) {
            el.css({ left: e.pageX - deltaX, top: e.pageY - deltaY });
        }
        this.stopDragging = function() {
            _I.dragDeactivate(null, true);
            $(document).unbind("mousedown", _I.mouseDown);
        }
        $(document).mousedown(_I.mouseDown);
    }
}


// Simple JavaScript Templating
// John Resig - http://ejohn.org/ - MIT Licensed
/*
<script type="text/html" id="script">
<div> 
<%= content %>
<% for(var i=0; i < names.length; i++) { %>
Name: <%= names[i] %> <br/>
<% } %>
</div>
</script>   

var tmpl = $("#itemtempalte").html();
var data = { content: "This is some textual content",
names: ["rick","markus"] };
$(document.body).html(TemplateParser(tmpl,data));
*/
this.TemplateParser = function(str, data) {
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
cache[str] = cache[str] ||
TemplateParser(document.getElementById(str).innerHTML) :

    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
new Function("obj",
"var p=[],print=function(){p.push.apply(p,arguments);};" +

    // Introduce the data as local variables using with(){}
"with(obj){p.push('" +

    // Convert the template into pure JavaScript
    str.replace(/[\r\t\n]/g, " ")
      .split("<%").join("\t")
      .replace(/((^|%>)[^\t]*)'/g, "$1\r")
      .replace(/\t=(.*?)%>/g, "',$1,'")
      .split("\t").join("');")
      .split("%>").join("p.push('")
      .split("\r").join("\\'") + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn(data) : fn;
};


String.prototype.htmlEncode = function() {
    var div = document.createElement('div');
    if (typeof (div.textContent) == 'string')
        div.textContent = this.toString();
    else
        div.innerText = this.toString();
    return div.innerHTML;
}
String.prototype.trimEnd = function(c) {
    return this.replace(/\s+$/, '');
}
String.prototype.trimStart = function(c) {
    return this.replace(/^\s+/, '');
}
String.repeat = function(chr, count) {
    var str = "";
    for (var x = 0; x < count; x++) { str += chr };
    return str;
}
String.prototype.padL = function(width, pad) {
    if (!width || width < 1)
        return this;

    if (!pad) pad = " ";
    var length = width - this.length
    if (length < 1) return this.substr(0, width);

    return (String.repeat(pad, length) + this).substr(0, width);
}
String.prototype.padR = function(width, pad) {
    if (!width || width < 1)
        return this;

    if (!pad) pad = " ";
    var length = width - this.length
    if (length < 1) this.substr(0, width);

    return (this + String.repeat(pad, length)).substr(0, width);
}
String.startsWith = function(str) {
    if (!str) return false;
    return this.substr(0, str.length) == str;
}
String.format = function(frmt, args) {
    for (var x = 0; x < arguments.length; x++) {
        frmt = frmt.replace("{" + x + "}", arguments[x + 1]);
    }
    return frmt;
}
String.prototype.format = function() {
    var a = [this];
    $.merge(a, arguments);
    return String.format.apply(this, a);
}
var _monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
Date.prototype.formatDate = function(format) {
    var date = this;
    if (!format)
        format = "MM/dd/yyyy";

    var month = date.getMonth();
    var year = date.getFullYear();

    if (format.indexOf("yyyy") > -1)
        format = format.replace("yyyy", year.toString());
    else if (format.indexOf("yy") > -1)
        format = format.replace("yy", year.toString().substr(2, 2));

    format = format.replace("dd", date.getDate().toString().padL(2, "0"));

    var hours = date.getHours();
    if (format.indexOf("t") > -1) {
        if (hours > 11)
            format = format.replace("t", "pm")
        else
            format = format.replace("t", "am")
    }
    if (format.indexOf("HH") > -1)
        format = format.replace("HH", hours.toString().padL(2, "0"));
    if (format.indexOf("hh") > -1) {
        if (hours > 12) hours -= 12;
        if (hours == 0) hours = 12;
        format = format.replace("hh", hours.toString().padL(2, "0"));
    }
    if (format.indexOf("mm") > -1)
        format = format.replace("mm", date.getMinutes().toString().padL(2, "0"));
    if (format.indexOf("ss") > -1)
        format = format.replace("ss", date.getSeconds().toString().padL(2, "0"));

    if (format.indexOf("MMMM") > -1)
        format = format.replace("MMMM", _monthNames[month]);
    else if (format.indexOf("MMM") > -1)
        format = format.replace("MMM", _monthNames[month].substr(0, 3));
    else
        format = format.replace("MM", month.toString().padL(2, "0"));

    return format;
}
Number.prototype.formatNumber = function(format, option) {
    var num = this;
    var fmt = Number.getNumberFormat();
    if (format == "c") {
        num = Math.round(num * 100) / 100;
        if (!option) option = "$"
        num = num.toLocaleString();
        var s = num.split(".");
        var p = s.length > 1 ? s[1] : '';
        return option + s[0] + fmt.d + p.padR(2, '0');
    }
    if (format.substr(0, 1) == "n") {
        if (format.length == 1)
            return num.toLocaleString()
        var dec = format.substr(1);
        dec = parseInt(dec);
        if (typeof (dec) != "number")
            return num.toLocaleString();
        num = num.toFixed(dec);
        var x = num.split(fmt.d);
        var x1 = x[0];
        var x2 = x.length > 1 ? fmt.d + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1))
            x1 = x1.replace(rgx, '$1' + fmt.c + '$2');
        return x1 + x2
    }
    if (format.substr(0, 1) == "f") {
        if (format.length == 1)
            return num.toString();
        var dec = format.substr(1);
        dec = parseFloat(dec);
        if (typeof (dec) != "number")
            return num.toString();
        return num.toFixed(dec);
    }
    return num.toString();
}
Number.getNumberFormat = function(cur) {
    var t = 1000.1.toLocaleString();
    var r = {};
    r.d = t.substr(5, 1);
    r.c = t.substr(1, 1);
    r.s = cur || "$";
    return r;
}
$.fn.serializeNoViewState = function() {
    return this.find("input,textarea,select,hidden").not("#__VIEWSTATE,#__EVENTVALIDATION").serialize();
}
var _ud = "undefined";

//})(jQuery);