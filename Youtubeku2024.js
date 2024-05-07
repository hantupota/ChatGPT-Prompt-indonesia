// ==UserScript==
// @name         ANJING Youtube NO preroll ads, Undetectable!
// @name:zh-CN   YouTube 前贴片广告拦截器
// @namespace    http://tampermonkey.net/
// @version      0.3.3
// @description  Not an average ad skipper, Bypass new restrictions!
// @description:zh-cn  Youtube 广告拦截器，将 youtube-nocookie 嵌入到主播放器中，无广告！
// @author       coder369
// @license      MIT
// @match       *://*.youtube.com/*
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @run-at       document_end
// @downloadURL https://update.greasyfork.org/scripts/477464/%5BBETA%5D%20Youtube%20NO%20preroll%20ads%2C%20Undetectable%21.user.js
// @updateURL https://update.greasyfork.org/scripts/477464/%5BBETA%5D%20Youtube%20NO%20preroll%20ads%2C%20Undetectable%21.meta.js
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js
// ==/UserScript==

//Youtube adblocker that embed youtube-nocookie into the main player for no ads!

//close adblocker to use
let currentPageUrl = window.location.href;
const delay = 200; // Milliseconds to wait after a failed attempt
const maxTries = 100; // Maximum number of retries in milliseconds
let tries = 0; // Current number of retries

window.addEventListener('beforeunload', function() {
    try {
        currentPageUrl = window.location.href;
    } catch(e) {
        console.error('AdBlock Bypass: Failed to preserve URL    '+e);
    }
});

document.addEventListener('yt-page-type-changed', function() {
    const newUrl = window.location.href;
    // remove the player iframe when the user navigates away from a "watch" page
    if (!newUrl.includes("watch")) {
        removeIframe();
    }
});

document.addEventListener('yt-navigate-finish', function() {
    try {
        const newUrl = window.location.href;
        if (newUrl !== currentPageUrl) {
            createIframe(newUrl);
        }
    } catch(e) {
        console.error('AdBlock Bypass: Failed to refresh player URL    '+e);
    }
});

// Get the video id from the url
function splitUrl(str) {
    try{
        return str.split('=')[1].split('&')[0];
    } catch(e) {
        console.error('Failed to split url'+e);
    }
}

// main function
function run() {
    try {
        const block = document.querySelector('.yt-playability-error-supported-renderers');
        if (!block) {
            if (tries === maxTries) return;
            tries++;
            setTimeout(run, delay);
        } else {
            magic();
        }
    } catch(e) {
        console.error('AdBlock Bypass: Failed to run    '+e);
    }
}

// URL parser
function extractParams(url) {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const videoId = params.get('v');
    const playlistId = params.get('list');
    const index = params.get('index');
    return { videoId, playlistId, index };
}

function magic() {
    try{
        console.log("Loaded");
        // remove block screen
        const block = document.querySelector('.yt-playability-error-supported-renderers');
        if (!block) return;
        block.parentNode.removeChild(block);
        // get the url for the iframe
        const url = window.location.href;
        createIframe(url);
        console.log('Finished');
    } catch(e) {
        console.error('AdBlock Bypass: Failed to replace player    '+e);
    }
}

// get the timestamp tag from the video URL, if any
function getTimestampFromUrl(str) {
    const timestamp = str.split("t=")[1];
    if (timestamp) {
        const timeArray = timestamp.split('&')[0].split(/h|m|s/);
        // we need to convert into seconds first, since "start=" only supports that unit
        if (timeArray.length < 3) {
            //seconds only, e.g. "t=30s" or "t=300"
            return "&start=" + timeArray[0];
        } else if (timeArray.length == 3) {
            // minutes & seconds, e.g. "t=1m30s"
            const timeInSeconds = (parseInt(timeArray[0]) * 60) + parseInt(timeArray[1]);
            return "&start=" + timeInSeconds;
        } else {
            // hours, minutes & seconds, e.g. "t=1h30m15s"
            const timeInSeconds = (parseInt(timeArray[0]) * 3600) + (parseInt(timeArray[1]) * 60) + parseInt(timeArray[2]);
            return "&start=" + timeInSeconds;
        }
    }
    return "";
}

// bring the iframe to the front - this helps with switching between theater & default mode
function bringToFront(target_id) {
    const all_z = [];
    document.querySelectorAll("*").forEach(function(elem) {
        all_z.push(elem.style.zIndex)
    })
    const max_index = Math.max.apply(null, all_z.map((x) => Number(x)));
    const new_max_index = max_index + 1;
    document.getElementById(target_id).style.zIndex = new_max_index;
}

function createIframe(newUrl) {
    let url = "";
    const commonArgs = "autoplay=1&modestbranding=1";
    if(newUrl.includes('&list')){
        url = "https://www.youtube-nocookie.com/embed/" + extractParams(newUrl).videoId + "?" + commonArgs + "&list=" + extractParams(newUrl).playlistId + "&index=" + extractParams(newUrl).index;
    }else{
        url = "https://www.youtube-nocookie.com/embed/" + splitUrl(newUrl) + "?" + commonArgs + getTimestampFromUrl(newUrl);
    }
    console.log(url);

    // recreate the player iframe if it was removed
    let player = document.getElementById("youtube-iframe");
    if(!player) {
        // get the mount point for the iframe
        const oldplayer = document.getElementById("error-screen");
        // create the iframe
        player = document.createElement('iframe');
        setYtPlayerAttributes(player, url);
        player.style = "height:100%;width:100%;border-radius:12px;";
        player.id = "youtube-iframe";
        // append the elements to the DOM
        oldplayer.appendChild(player);
    } else {
        setYtPlayerAttributes(player, url);
    }
    bringToFront("youtube-iframe");
}

function removeIframe() {
    const player = document.getElementById("youtube-iframe");
    player.parentNode.removeChild(player);
}

function setYtPlayerAttributes(player, url){
    // set all the necessary player attributes here
    player.setAttribute('src', url);
    player.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    player.setAttribute('frameborder', '0');
    player.setAttribute('allowfullscreen', "allowfullscreen");
    player.setAttribute('mozallowfullscreen', "mozallowfullscreen");
    player.setAttribute('msallowfullscreen', "msallowfullscreen");
    player.setAttribute('oallowfullscreen', "oallowfullscreen");
    player.setAttribute('webkitallowfullscreen', "webkitallowfullscreen");
}

// Execute the code
(function() {
    'use strict';
    run();
})();

(function() {
    'use strict';
    const $ = jQuery.noConflict(true);

    let logo = $('#logo-icon').empty();
    let imglogo = document.createElement('img');

    if ($('html').is('[dark]')) {
        $(logo).append($('<img>', {src: 'https://i.imgur.com/m3TlTOK.png', style: 'width: 94px'}));
    } else {
        $(logo).append($('<img>', {src: 'https://i.imgur.com/k3guVls.png', style: 'width: 94px'}));
    }
})();
// Execute the code
// ==/Selection and Copying Restorer (Universal)==
(async function (context) {
    'use strict';

    const { console: console_ } = context

    const console = new Proxy({}, {
        get(target, prop) {
            return target[prop] || console_[prop];
        },
        set(target, prop, value) {
            target[prop] = value.bind(console_);
            return true;
        }
    });

    for (const k of ['log', 'debug', 'dir']) {
        console[k] = console_[k];
    }

    const uWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    if (!(uWin instanceof Window)) return;

    /** @type {globalThis.PromiseConstructor} */
    const Promise = (async () => { })().constructor;// YouTube hacks Promise in WaterFox Classic and "Promise.resolve(0)" nevers resolve.

    /** @type {() => Selection | null} */
    const getSelection = uWin.getSelection.bind(uWin) || Error()();
    /** @type {(callback: FrameRequestCallback) => number} */
    const requestAnimationFrame = uWin.requestAnimationFrame.bind(uWin) || Error()();
    /** @type {(elt: Element, pseudoElt?: string | null) => CSSStyleDeclaration} */
    const getComputedStyle = uWin.getComputedStyle.bind(uWin) || Error()();

    const originalFocusFn = HTMLElement.prototype.focus;

    let maxTrial = 16;
    while (!document || !document.documentElement) {
        await new Promise(requestAnimationFrame);
        if (--maxTrial < 0) return;
    }

    const SCRIPT_TAG = "Selection and Copying Restorer (Universal)";
    const $nil = () => { };


    const getStorageSiteByPass = async () => {
        await Promise.resolve(); // TODO
        return {};
    }

    const siteByPassStored = (await getStorageSiteByPass()) || {};
    const siteByPassDefault = {
        "gm_remain_focus_on_mousedown": [
            'https://codi.link'
        ],
        "gm_no_custom_context_menu": [
            "https://www.youtube.com", "https://m.youtube.com",
            "https://github.dev", "https://vscode.dev",
            "https://www.photopea.com",
            "https://www.google.com", "https://docs.google.com", "https://drive.google.com",
            "https://www.dropbox.com", "https://www.terabox.com",
            "https://outlook.live.com", "https://mail.yahoo.co.jp",
        ]
    };

    // https://stackoverflow.com/questions/68488017/
    let combine = function* (...iterators) {
        for (let it of iterators) yield* it;
    };

    const $settings = (() => {

        const siteByPassMem = {};
        const keys = combine(Object.keys(siteByPassStored), Object.keys(siteByPassDefault))
        for (const gmKey of keys) {
            if (siteByPassMem[gmKey]) continue;
            const store = siteByPassMem[gmKey] = new Set();
            const defaultByPass = siteByPassDefault[gmKey];
            if (defaultByPass && defaultByPass.length >= 1) {
                for (const site of defaultByPass) {
                    store.add(site);
                }
            }
            const storage = siteByPassStored[gmKey];
            if (storage && storage.length >= 1) {
                for (const value of storage) {
                    if (value.charAt(0) === '~') store.delete(value.substring(1));
                    else store.add(value);
                }
            }
        }

        return new Proxy(siteByPassMem, {
            get(target, prop) {
                if (!$[prop]) return false;
                const v = target[prop];
                if (v) {
                    if (v.has(location.origin)) return false;
                }
                return true;
            },
            set(target, prop, value) {
                return false;
            }
        });


    })(siteByPassStored);

    let focusNotAllowedUntil = 0;

    function isLatestBrowser() {
        let res;
        try {
            let o = { $nil };
            o?.$nil();
            o = null;
            o?.$nil();
            res = true;
        } catch (e) { }
        return !!res;
    }
    if (!isLatestBrowser()) console.warn(`${SCRIPT_TAG}: Browser version before 2020-01-01 is not recommended. Please update to the latest version.`);

    function getEventListenerSupport() {
        if ('_b1850' in $) return $._b1850
        let prop = 0;
        document.createAttribute('z').addEventListener('nil', $nil, {
            get passive() {
                prop |= 1;
            },
            get once() {
                prop |= 2;
            }
        });
        return ($._b1850 = prop);
    }

    function isSupportAdvancedEventListener() {
        return (getEventListenerSupport() & 3) === 3;
    }

    function isSupportPassiveEventListener() {
        return (getEventListenerSupport() & 1) === 1;
    }

    function inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    function cloneRange() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;
        const range = selection.getRangeAt(0);
        return range.cloneRange();
    }

    /* globals WeakRef:false */

    /** @type {(o: Object | null) => WeakRef | null} */
    const mWeakRef = typeof WeakRef === 'function' ? (o => o ? new WeakRef(o) : null) : (o => o || null);

    /** @type {(wr: Object | null) => Object | null} */
    const kRef = (wr => (wr && wr.deref) ? wr.deref() : wr);

    /*
    const whiteListForCustomContextMenu = [
        'https://drive.google.com/',
        'https://mail.google.com/',
        'https://www.google.com/maps/',
        'https://www.dropbox.com/',
        'https://outlook.live.com/mail/'
    ];
    const isCustomContextMenuAllowedFn = () => {
        const href = location.href;
        for (h of whiteListForCustomContextMenu) {
            if (href.startsWith(h)) return true;
        }
        return false;
    }
    */
    const isCustomContextMenuAllowedFn = () => { return false; }
    let isCustomContextMenuAllowed = null;
    const $ = {
        utSelectionColorHack: 'msmtwejkzrqa',
        utTapHighlight: 'xfcklblvkjsj',
        utLpSelection: 'gykqyzwufxpz',
        utHoverBlock: 'meefgeibrtqx', // scc_emptyblock
        // utNonEmptyElm: 'ilkpvtsnwmjb',
        utNonEmptyElmPrevElm: 'jttkfplemwzo',
        utHoverTextWrap: 'oseksntfvucn',
        ksFuncReplacerCounter: '___dqzadwpujtct___',
        ksEventReturnValue: ' ___ndjfujndrlsx___',
        ksSetData: '___rgqclrdllmhr___',
        ksNonEmptyPlainText: '___grpvyosdjhuk___',

        eh_capture_passive: () => isSupportPassiveEventListener() ? ($._eh_capture_passive = ($._eh_capture_passive || {
            capture: true,
            passive: true
        })) : true,
        eh_capture_active: () => isSupportPassiveEventListener() ? ($._eh_capture_passive = ($._eh_capture_passive || {
            capture: true,
            passive: false
        })) : true,

        mAlert_DOWN: $nil, // dummy function in case alert replacement is not valid
        mAlert_UP: $nil, // dummy function in case alert replacement is not valid


        gm_no_custom_context_menu: true,
        lpKeyPressing: false,
        lpKeyPressingPromise: Promise.resolve(),

        /** @readonly */
        weakMapFuncReplaced: new WeakMap(),
        ksFuncReplacerCounterId: 0,
        isStackCheckForFuncReplacer: false, // multi-line stack in FireFox
        isGlobalEventCheckForFuncReplacer: false,
        enableReturnValueReplacment: false, // set true by code

        rangeOnKeyDown: null,
        // rangeOnKeyUp: null,

        /** @readonly */
        eyEvts: ['keydown', 'keyup', 'copy', 'contextmenu', 'select', 'selectstart', 'dragstart', 'beforecopy'], // slope: throughout
        delayMouseUpTasks: 0,

        isNum: (d) => (d > 0 || d < 0 || d === 0),

        getNodeType: (n) => ((n instanceof Node) ? n.nodeType : -1),

        isAnySelection: function () {
            const sel = getSelection();
            return !sel ? null : (typeof sel.isCollapsed === 'boolean') ? !sel.isCollapsed : (sel.toString().length > 0);
        },

        updateIsWindowEventSupported: function () {
            // https://developer.mozilla.org/en-US/docs/Web/API/Window/event
            // FireFox >= 66
            let p = document.createElement('noscript');
            p.onclick = function (ev) { $.isGlobalEventCheckForFuncReplacer = (window.event === ev) };
            p.dispatchEvent(new Event('click'));
            p = null;
        },

        /**
         *
         * @param {string} cssStyle
         * @param {Node?} container
         * @returns
         */
        createCSSElement: function (cssStyle, container) {
            const css = document.createElement('style'); // slope: DOM throughout
            css.textContent = cssStyle;
            if (container) container.appendChild(css);
            return css;
        },

        createFakeAlert: function (_alert) {
            if (typeof _alert !== 'function') return null;

            function alert(msg) {
                alert.__isDisabled__() ? console.log("alert msg disabled: ", msg) : _alert.apply(this, arguments);
            };
            alert.toString = _alert.toString.bind(_alert);
            return alert;
        },

        /**
         *
         * @param {Function} originalFunc
         * @param {string} pName
         * @returns
         */
        createFuncReplacer: function (originalFunc) {
            const id = ++$.ksFuncReplacerCounterId;
            const resFX = function (ev) {
                const res = originalFunc.apply(this, arguments);
                if (res === false) {
                    if (!this || !ev) return false;
                    const pName = 'on' + ev.type;
                    const selfFunc = this[pName];
                    if (typeof selfFunc !== 'function') return false;
                    if (selfFunc[$.ksFuncReplacerCounter] !== id) return false;
                    // if this is null or undefined, or this.onXXX is not this function
                    if (ev.cancelable !== false && $.shouldDenyPreventDefault(ev)) {
                        if ($.isGlobalEventCheckForFuncReplacer === true) {
                            if (window.event !== ev) return false; // eslint-disable-line
                        }
                        if ($.isStackCheckForFuncReplacer === true) {
                            let stack = (new Error()).stack;
                            let onlyOneLineStack = stack.indexOf('\n') === stack.lastIndexOf('\n');
                            if (onlyOneLineStack === false) return false;
                        }
                        return true;
                    }
                }
                return res;
            }
            resFX[$.ksFuncReplacerCounter] = id;
            resFX.toString = originalFunc.toString.bind(originalFunc);
            $.weakMapFuncReplaced.set(originalFunc, resFX);
            return resFX;
        },


        // listenerDisableAll: async (evt) => {
        // },

        onceCssHighlightSelection: async () => {
            if (document.documentElement.hasAttribute($.utLpSelection)) return;
            $.onceCssHighlightSelection = null
            await Promise.resolve();
            const s = [...document.querySelectorAll('a,p,div,span,b,i,strong,li')].filter(elm => elm.childElementCount === 0); // randomly pick an element containing text only to avoid css style bug
            const elm = !s.length ? document.body : s[s.length >> 1];
            await Promise.resolve();
            const selectionStyle = getComputedStyle(elm, '::selection');
            let selectionBackgroundColor = selectionStyle.getPropertyValue('background-color') || '';
            if (selectionBackgroundColor.length > 9 && /^rgba\(\d+,\s*\d+,\s*\d+,\s*0\)$/.test(selectionBackgroundColor)) {
                document.documentElement.setAttribute($.utSelectionColorHack, "");
            } else {
                let bodyBackgroundColor = getComputedStyle(document.body).getPropertyValue('background-color') || '';
                if (bodyBackgroundColor === selectionBackgroundColor) {
                    document.documentElement.setAttribute($.utSelectionColorHack, "");
                }
            }
            await Promise.resolve();
            const elmStyle = getComputedStyle(elm);
            let highlightColor = elmStyle.getPropertyValue('-webkit-tap-highlight-color') || '';
            if (highlightColor.length > 9 && /^rgba\(\d+,\s*\d+,\s*\d+,\s*0\)$/.test(highlightColor)) document.documentElement.setAttribute($.utTapHighlight, "");
            document.documentElement.setAttribute($.utTapHighlight, "");
        },

        clipDataProcess: function (clipboardData) {

            if (!clipboardData) return;
            const evt = kRef(clipboardData[$.ksSetData]); // NOT NULL when preventDefault is called
            if (!evt || evt.clipboardData !== clipboardData) return;
            const plainText = clipboardData[$.ksNonEmptyPlainText]; // NOT NULL when setData is called with non empty input
            if (!plainText) return;

            // BOTH preventDefault and setData are called.

            if (evt.cancelable === false || evt.defaultPrevented === true) return;


            // ---- disable text replacement on plain text node(s) ----

            const rangeOnKeyDown = $.rangeOnKeyDown || 0;
            let isEditorLikeText = false; // TBC
            if (typeof rangeOnKeyDown.compareBoundaryPoints === 'function') {
                const range = cloneRange();
                if (range) {
                    // checking whether selection range remains the same (vs Ctrl-C)
                    const isRangeUnchanged = rangeOnKeyDown.compareBoundaryPoints(Range.START_TO_END, range) === 0;
                    if(isRangeUnchanged && range.collapsed){
                        isEditorLikeText = true;
                    }
                }
            }
            let log = null;
            let callEventDefault = true;
            if (isEditorLikeText) {

            } else {

                let cSelection = getSelection();
                if (!cSelection) return; // ?
                let exactSelectionText = cSelection.toString();
                let trimedSelectionText = exactSelectionText.trim();
                if (exactSelectionText.length > 0 && exactSelectionText.length < plainText.length) {
                    let pSelection = trimedSelectionText.replace(/[\r\n\t\b\x20\xA0\u200b\uFEFF\u3000]+/g, '');
                    let pRequest = plainText.replace(/[\r\n\t\b\x20\xA0\u200b\uFEFF\u3000]+/g, '');
                    // a newline char (\n) could be generated between nodes.
                    let search = pRequest.indexOf(pSelection);
                    let bool05 = search >= 0 && search < (plainText.length / 2) + 1;
                    if (bool05) {
                        let nodeType1 = $.getNodeType(cSelection.anchorNode);
                        let nodeType2 = $.getNodeType(cSelection.focusNode);
                        let test1 = nodeType1 === 3 && nodeType2 === 3;
                        if (!test1) test1 = cSelection.anchorNode === cSelection.focusNode && nodeType1 === 1;
                        bool05 = bool05 && test1;
                    }
                    if (bool05) {
                        callEventDefault = false;
                        log = ({
                            msg: "copy event - clipboardData replacement is NOT allowed as the text node(s) is/are selected.",
                            oldText: trimedSelectionText,
                            newText: plainText,
                        });
                        callEventDefault = false;
                    }
                }
                if(!callEventDefault){

                }else if (trimedSelectionText) {
                    // there is replacement data and the selection is not empty
                    log = ({
                        msg: "copy event - clipboardData replacement is allowed and the selection is not empty",
                        oldText: trimedSelectionText,
                        newText: plainText,
                    });
                } else {
                    // there is replacement data and the selection is empty
                    log = ({
                        msg: "copy event - clipboardData replacement is allowed and the selection is empty",
                        oldText: trimedSelectionText,
                        newText: plainText,
                    });
                }
            }

            if (callEventDefault) {
                // --- allow preventDefault for text replacement ---
                $.bypass = true;
                evt.preventDefault();
                $.bypass = false;
            }

            // ---- message log ----
            log && console.log(log);

        },

        shouldDenyPreventDefault: function (evt) {
            if (!evt || $.bypass) return false;
            let j = $.eyEvts.indexOf(evt.type);
            const target = evt.target;
            switch (j) {
                case 6: // dragstart

                    if (isCustomContextMenuAllowed === null) isCustomContextMenuAllowed = isCustomContextMenuAllowedFn();
                    if (isCustomContextMenuAllowed) return false;

                    if ($.enableDragging) return false;
                    if (target instanceof Element && target.hasAttribute('draggable')) {
                        $.enableDragging = true;
                        return false;
                    }
                    // if(evt.target.hasAttribute('draggable')&&evt.target!=window.getSelection().anchorNode)return false;
                    return true;
                case 3: // contextmenu

                    if (!$settings.gm_no_custom_context_menu) return false;

                    if (isCustomContextMenuAllowed === null) isCustomContextMenuAllowed = isCustomContextMenuAllowedFn();
                    if (isCustomContextMenuAllowed) return false;

                    if (target instanceof Element) {
                        switch (target.nodeName) {
                            case 'IMG':
                            case 'SPAN':
                            case 'P':
                            case 'BODY':
                            case 'HTML':
                            case 'A':
                            case 'B':
                            case 'I':
                            case 'PRE':
                            case 'CODE':
                            case 'CENTER':
                            case 'SMALL':
                            case 'SUB':
                            case 'SAMP':
                                return true;
                            case 'VIDEO':
                            case 'AUDIO':
                                return $.gm_native_video_audio_contextmenu ? true : false;

                        }
                        // if (target.closest('ytd-player#ytd-player')) return false;
                        if ((target.textContent || "").trim().length === 0 && target.querySelector('video, audio')) {
                            return false; // exclude elements like video
                        }
                    }
                    return true;
                case -1:
                    return false;
                case 0: // keydown
                case 1: // keyup

                    if (isCustomContextMenuAllowed === null) isCustomContextMenuAllowed = isCustomContextMenuAllowedFn();
                    if (isCustomContextMenuAllowed) return false;
                    return (evt.keyCode === 67 && (evt.ctrlKey || evt.metaKey) && !evt.altKey && !evt.shiftKey && $.isAnySelection() === true);
                case 2: // copy

                    if (isCustomContextMenuAllowed === null) isCustomContextMenuAllowed = isCustomContextMenuAllowedFn();
                    if (isCustomContextMenuAllowed) return false;

                    if (!(target instanceof Node) && !(target instanceof Window) && !(target instanceof Document)) return false; // bypass unrecognized eventTargets
                    if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return false; // bypass input/textarea elements
                    if (target instanceof HTMLElement && (target.closest('[contenteditable]'))) return false; // bypass [contenteditable] and its descendants
                    if (target.parentNode instanceof HTMLElement && (target.parentNode.closest('[contenteditable]'))) return false; // bypass textNode under [contenteditable] and its descendants

                    if (!('clipboardData' in evt && 'setData' in DataTransfer.prototype)) return true; // Event oncopy not supporting clipboardData
                    if (evt.cancelable === false || evt.defaultPrevented === true) return true;

                    const cd = kRef(evt.clipboardData[$.ksSetData]);
                    if (cd && cd !== evt) return true; // in case there is a bug
                    evt.clipboardData[$.ksSetData] = mWeakRef(evt);

                    $.clipDataProcess(evt.clipboardData);

                    return true; // preventDefault in clipDataProcess


                default:
                    return true;
            }
        },

        enableSelectClickCopy: function () {

            !(function ($setData) {
                DataTransfer.prototype.setData = (function setData() {

                    if (arguments[0] === 'text/plain' && typeof arguments[1] === 'string') {
                        if (arguments[1].trim().length > 0) {
                            this[$.ksNonEmptyPlainText] = arguments[1]
                        } else if (this[$.ksNonEmptyPlainText]) {
                            arguments[1] = this[$.ksNonEmptyPlainText]
                        }
                    }

                    $.clipDataProcess(this)

                    let res = $setData.apply(this, arguments)

                    return res;

                })
            })(DataTransfer.prototype.setData);

            Object.defineProperties(DataTransfer.prototype, {
                [$.ksSetData]: { // store the event
                    value: null,
                    writable: true,
                    enumerable: false,
                    configurable: true
                },
                [$.ksNonEmptyPlainText]: { // store the text
                    value: null,
                    writable: true,
                    enumerable: false,
                    configurable: true
                }
            })


            Event.prototype.preventDefault = (function (f) {
                function preventDefault() {
                    if (this.cancelable !== false && !$.shouldDenyPreventDefault(this)) f.call(this);
                }
                preventDefault.toString = f.toString.bind(f);
                return preventDefault;
            })(Event.prototype.preventDefault);

            (() => {
                const pd = Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(Event.prototype, 'returnValue') : {};
                const { get, set } = pd;
                if (get && set) {
                    const filterTypes = new Set($.eyEvts);
                    Object.defineProperty(Event.prototype, "returnValue", {
                        get() {
                            const type = this.type;
                            if (!filterTypes.has(type)) return get.call(this);
                            return $.ksEventReturnValue in this ? this[$.ksEventReturnValue] : true;
                        },
                        set(newValue) {
                            const type = this.type;
                            if (!filterTypes.has(type)) return set.call(this, newValue);
                            const convertedNV = !!newValue;
                            if (convertedNV === false) this.preventDefault();
                            if (this[$.ksEventReturnValue] !== false) {
                                this[$.ksEventReturnValue] = convertedNV;
                            }
                        },
                        enumerable: true,
                        configurable: true
                    });
                } else {
                    Object.defineProperty(Event.prototype, "returnValue", {
                        get() {
                            return $.ksEventReturnValue in this ? this[$.ksEventReturnValue] : true;
                        },
                        set(newValue) {
                            if (newValue === false) this.preventDefault();
                            this[$.ksEventReturnValue] = newValue;
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            })();

            $.enableReturnValueReplacment = true;
            // for (const eyEvt of $.eyEvts) {
            //     document.addEventListener(eyEvt, $.listenerDisableAll, true); // Capture Event; passive:false; expected occurrence COMPLETELY before Target Capture and Target Bubble
            // }

            // userscript bug ?  window.alert not working
            /** @type {Window | null} */
            let window_ = uWin;
            if (window_) {
                let _alert = window_.alert; // slope: temporary
                if (typeof _alert === 'function') {
                    let _mAlert = $.createFakeAlert(_alert);
                    if (_mAlert) {
                        let clickBlockingTo = 0;
                        _mAlert.__isDisabled__ = () => clickBlockingTo > +new Date;
                        $.mAlert_DOWN = () => (clickBlockingTo = +new Date + 50);
                        $.mAlert_UP = () => (clickBlockingTo = +new Date + 20);
                        window_.alert = _mAlert
                    }
                    _mAlert = null;
                }
                _alert = null;
            }
            window_ = null;

        },

        lpCheckPointer: function (targetElm) {
            if (targetElm instanceof Element && targetElm.matches('*:hover')) {
                if (getComputedStyle(targetElm).getPropertyValue('cursor') === 'pointer' && targetElm.textContent) return true;
            }
            return false;
        },

        /**
         *
         * @param {Event} evt
         * @param {boolean} toPreventDefault
         */
        eventCancel: function (evt, toPreventDefault) {
            $.bypass = true;
            !toPreventDefault || evt.preventDefault()
            evt.stopPropagation();
            evt.stopImmediatePropagation();
            $.bypass = false;
        },

        lpHoverBlocks: [],
        lpKeyAltLastPressAt: 0,
        lpKeyAltPressInterval: 0,

        noPlayingVideo: function () {

            // prevent poor video preformance

            let noPlaying = true;
            for (const video of document.querySelectorAll('video[src]')) {

                if (video.paused === false) {
                    noPlaying = false;
                    break;
                }

            }
            return noPlaying;


        },



        /** @type {EventListener} */
        lpKeyDown: (evt) => {

            if (!$.gm_lp_enable) return;

            const isAltPress = (evt.key === "Alt" && evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey);

            if (isAltPress) {

                $.lpKeyAltLastPressAt = +new Date;

                let element = evt.target;


                if ($.lpKeyPressing === false && (element instanceof Node) && element.parentNode && !evt.repeat && $.noPlayingVideo()) {

                    $.lpKeyPressing = true;

                    $.cid_lpKeyPressing = setInterval(() => {
                        if ($.lpKeyAltLastPressAt + 500 < +new Date) {
                            $.lpCancelKeyPressAlt();
                        }
                    }, 137);

                    const rootNode = $.rootHTML(element);
                    if (rootNode) {
                        let tmp_wmEty = null;


                        let wmTextWrap = new WeakMap();

                        $.lpKeyPressingPromise = $.lpKeyPressingPromise.then(() => {
                            for (const elm of $.lpHoverBlocks) {
                                elm.removeAttribute($.utNonEmptyElmPrevElm)
                                elm.removeAttribute($.utHoverTextWrap)
                            }
                            $.lpHoverBlocks.length = 0;
                        }).then(() => {
                            tmp_wmEty = new WeakMap(); // 1,2,3.....: non-empty elm,  -1:empty elm
                            const s = [...rootNode.querySelectorAll('*:not(button, textarea, input, script, noscript, style, link, img, br)')].filter((elm) => elm.childElementCount === 0 && (elm.textContent || '').trim().length > 0)
                            for (const elm of s) tmp_wmEty.set(elm, 1);
                            return s;
                        }).then((s) => {
                            let laterArr = [];
                            let promises = [];

                            let promiseCallback = parentNode => {
                                if (wmTextWrap.get(parentNode) !== null) return;
                                const m = [...parentNode.children].some(elm => {
                                    const value = getComputedStyle(elm).getPropertyValue('z-index') || '';
                                    if (value.length > 0) return $.isNum(+value)
                                    return false
                                })
                                wmTextWrap.set(parentNode, m)
                                if (m) {
                                    $.lpHoverBlocks.push(parentNode);
                                    parentNode.setAttribute($.utHoverTextWrap, '')
                                }

                            };

                            for (const elm of s) {
                                let qElm = elm;
                                let qi = 1;
                                while (true) {
                                    let pElm = qElm.previousElementSibling;
                                    let anyEmptyHover = false;
                                    while (pElm) {
                                        if (tmp_wmEty.get(pElm) > 0) break;
                                        if (!pElm.matches(`button, textarea, input, script, noscript, style, link, img, br`) && (pElm.textContent || '').length === 0 && pElm.clientWidth * pElm.clientHeight > 0) {
                                            laterArr.push(pElm);
                                            anyEmptyHover = true;
                                        }
                                        pElm = pElm.previousElementSibling;
                                    }
                                    if (anyEmptyHover && !wmTextWrap.has(qElm.parentNode)) {
                                        wmTextWrap.set(qElm.parentNode, null)
                                        promises.push(Promise.resolve(qElm.parentNode).then(promiseCallback))
                                    }
                                    qElm = qElm.parentNode;
                                    if (!qElm || qElm === rootNode) break;
                                    qi++
                                    if (tmp_wmEty.get(qElm) > 0) break;
                                    tmp_wmEty.set(qElm, qi)
                                }
                            }

                            tmp_wmEty = null;

                            Promise.all(promises).then(() => {
                                promises.length = 0;
                                promises = null;
                                promiseCallback = null;
                                for (const pElm of laterArr) {
                                    let parentNode = pElm.parentNode
                                    if (wmTextWrap.get(parentNode) === true) {
                                        $.lpHoverBlocks.push(pElm);
                                        pElm.setAttribute($.utNonEmptyElmPrevElm, '');
                                    }
                                }
                                laterArr.length = 0;
                                laterArr = null;
                                wmTextWrap = null;
                            })
                        })

                    }

                }


            } else if ($.lpKeyPressing === true) {

                $.lpCancelKeyPressAlt();

            }

        },
        lpCancelKeyPressAlt: () => {
            $.lpKeyPressing = false;
            if ($.cid_lpKeyPressing > 0) $.cid_lpKeyPressing = clearInterval($.cid_lpKeyPressing);

            $.lpKeyPressingPromise = $.lpKeyPressingPromise.then(() => {
                for (const elm of $.lpHoverBlocks) {
                    elm.removeAttribute($.utNonEmptyElmPrevElm);
                    elm.removeAttribute($.utHoverTextWrap);
                }
                $.lpHoverBlocks.length = 0;
            })

            setTimeout(function () {
                if ($.lpMouseActive === 1) {
                    $.lpMouseUpClear();
                    $.lpMouseActive = 0;
                }
            }, 32);

        },
        /** @type {EventListener} */
        lpKeyUp: (evt) => {

            if (!$.gm_lp_enable) return;

            if ($.lpKeyPressing === true) {
                $.lpCancelKeyPressAlt();
            }

        },

        lpAltRoots: [],

        /** @type {EventListener} */
        lpMouseDown: (evt) => {

            if (!$.gm_lp_enable) return;

            $.lpMouseActive = 0;
            if (evt.altKey && !evt.ctrlKey && !evt.metaKey && !evt.shiftKey && evt.button === 0 && (evt.target instanceof Node) && $.noPlayingVideo()) {
                $.lpMouseActive = 1;
                $.eventCancel(evt, false);
                const rootNode = $.rootHTML(evt.target);
                $.lpAltRoots.push(rootNode);
                rootNode.setAttribute($.utLpSelection, '');
            }
        },

        lpMouseUpClear: function () {
            for (const rootNode of $.lpAltRoots) rootNode.removeAttribute($.utLpSelection);
            $.lpAltRoots.length = 0;
            if ($.onceCssHighlightSelection) requestAnimationFrame($.onceCssHighlightSelection);
        },

        /** @type {EventListener} */
        lpMouseUp: (evt) => {

            if (!$.gm_lp_enable) return;

            if ($.lpMouseActive === 1) {
                $.lpMouseActive = 2;
                $.eventCancel(evt, false);
                $.lpMouseUpClear();
            }
        },

        /** @type {EventListener} */
        lpClick: (evt) => {

            if (!$.gm_lp_enable) return;

            if ($.lpMouseActive === 2) {
                $.eventCancel(evt, false);
            }
        },

        lpEnable: function () { // this is an optional feature for modern browser
            // the built-in browser feature has already disabled the default event behavior, the coding is just to ensure no "tailor-made behavior" occuring.
            const opt = $.eh_capture_passive();
            document.addEventListener('keydown', $.lpKeyDown, opt)
            document.addEventListener('keyup', $.lpKeyUp, opt)
            document.addEventListener('mousedown', $.lpMouseDown, opt)
            document.addEventListener('mouseup', $.lpMouseUp, opt)
            document.addEventListener('click', $.lpClick, opt)
        },

        /**
         *
         * @param {Node | null} node
         * @returns
         */
        rootHTML: (node) => {

            if (!(node instanceof Node)) return null;
            if (!node.ownerDocument) return node;
            let rootNode = node.getRootNode ? node.getRootNode() : null
            if (!rootNode) {
                let pElm = node;
                for (let parentNode; parentNode = pElm.parentNode;) {
                    pElm = parentNode;
                }
                rootNode = pElm;
            }


            rootNode = rootNode.querySelector('html') || node.ownerDocument.documentElement || null;
            return rootNode

        },

        // note: "user-select: XXX" is deemed as invalid property value in FireFox.

        injectCSSRules: () => {
            const cssStyleOnReady = `

            html {
                --sac-user-select: auto;
            }
            [role="slider"], input, textarea, video[src], :empty {
                --sac-user-select: nil;
            }
            label:not(:empty) {
                --sac-user-select: auto;
            }

            html, html *,
            html *[style], html *[class] {
                -webkit-touch-callout: default !important; -moz-user-select: var(--sac-user-select) !important; -webkit-user-select: var(--sac-user-select) !important; user-select: var(--sac-user-select) !important;
            }

            html *:hover, html *:link, html *:visited, html *:active {
                -webkit-touch-callout: default !important; -moz-user-select: var(--sac-user-select) !important; -webkit-user-select: var(--sac-user-select) !important; user-select: var(--sac-user-select) !important;
            }

            html *::before, html *::after {
                -webkit-touch-callout: default !important; -moz-user-select: auto !important; -webkit-user-select: auto !important; user-select: auto !important;
            }

            *:hover>img[src]{pointer-events:auto !important;}

            [${$.utSelectionColorHack}] :not(input):not(textarea)::selection{ background-color: Highlight !important; color: HighlightText !important;}
            [${$.utSelectionColorHack}] :not(input):not(textarea)::-moz-selection{ background-color: Highlight !important; color: HighlightText !important;}
            [${$.utTapHighlight}] *{ -webkit-tap-highlight-color: rgba(0, 0, 0, 0.18) !important;}

            [${$.utHoverTextWrap}]>[${$.utNonEmptyElmPrevElm}]{pointer-events:none !important;}
            [${$.utHoverTextWrap}]>*{z-index:inherit !important;}

            html[${$.utLpSelection}] *:hover, html[${$.utLpSelection}] *:hover * { cursor:text !important;}
            html[${$.utLpSelection}] :not(input):not(textarea)::selection {background-color: rgba(255, 156, 179, 0.5) !important;}
            html[${$.utLpSelection}] :not(input):not(textarea)::-moz-selection {background-color: rgba(255, 156, 179, 0.5) !important;}

            img[${$.utHoverBlock}="4"]{display:none !important;}
            [${$.utHoverBlock}="7"]{padding:0 !important;overflow:hidden !important;}
            [${$.utHoverBlock}="7"]>img[${$.utHoverBlock}="4"]:first-child{
                display:inline-block !important;
                position: relative !important;
                top: auto !important;
                left: auto !important;
                bottom: auto !important;
                right: auto !important;
                opacity: 0 !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                height: 100% !important;
                outline: 0 !important;
                border: 0 !important;
                box-sizing: border-box !important;
                transform: initial !important;
                -moz-user-select: none !important;
                -webkit-user-select: none !important;
                user-select: none !important;
                z-index:1 !important;
                float: left !important;
                cursor:inherit !important;
                pointer-events:inherit !important;
                border-radius: inherit !important;
                background:none !important;
            }

            `.trim();
            $.createCSSElement(cssStyleOnReady, document.documentElement);
        },

        disableHoverBlock: () => {

            const nMap = new WeakMap();

            /**
             *
             * @param {HTMLElement} elm
             * @returns
             */
            function elmParam(elm) {
                let mElm = nMap.get(elm);
                if (!mElm) nMap.set(elm, mElm = {});
                return mElm;
            }

            /**
             *
             * @param {DOMRect} rect1
             * @param {DOMRect} rect2
             * @returns
             */
            function overlapArea(rect1, rect2) {

                let l1 = {
                    x: rect1.left,
                    y: rect1.top
                }

                let r1 = {
                    x: rect1.right,
                    y: rect1.bottom
                }
                let l2 = {
                    x: rect2.left,
                    y: rect2.top
                }

                let r2 = {
                    x: rect2.right,
                    y: rect2.bottom
                }

                // Area of 1st Rectangle
                let area1 = Math.abs(l1.x - r1.x) * Math.abs(l1.y - r1.y);

                // Area of 2nd Rectangle
                let area2 = Math.abs(l2.x - r2.x) * Math.abs(l2.y - r2.y);

                // Length of intersecting part i.e
                // start from max(l1.x, l2.x) of
                // x-coordinate and end at min(r1.x,
                // r2.x) x-coordinate by subtracting
                // start from end we get required
                // lengths
                let x_dist = Math.min(r1.x, r2.x) - Math.max(l1.x, l2.x);
                let y_dist = Math.min(r1.y, r2.y) - Math.max(l1.y, l2.y);
                let areaI = 0;
                if (x_dist > 0 && y_dist > 0) {
                    areaI = x_dist * y_dist;
                }

                return {
                    area1,
                    area2,
                    areaI
                };


            }

            function redirectEvent(event, toElement) {

                toElement.dispatchEvent(new event.constructor(event.type, event));
                if (event.type !== 'wheel') event.preventDefault();
                event.stopPropagation();
            }

            /** @type {WeakMap<Node, number>} */
            const floatingBlockHover = new WeakMap();

            /**
                @typedef NImg
                @type {Object}
                @property {HTMLImageElement} elm The Image Element
                @property {number} lastTime lastTime
                @property {number} cid_fade cid for fade

            */

            /** @type { NImg[] } */
            let _nImgs = [];
            const handleNImgs = async (img) => {
                await Promise.resolve();
                for (const s of _nImgs) {
                    if (s.elm === img) {
                        s.lastTime = +new Date
                    }
                }
            }

            function nImgFunc() {

                for (const s of _nImgs) {
                    if (s.lastTime + 800 < +new Date) {
                        s.lastTime = +new Date;
                        return s.elm
                    }
                }

                let nImg = document.createElement('img');
                nImg.setAttribute('title', '　');
                nImg.setAttribute('alt', '　');
                nImg.onerror = function () {
                    if (this.parentNode instanceof Node) this.parentNode.removeChild(this)
                }
                nImg.setAttribute($.utHoverBlock, '4');
                const handle = function (event) {
                    if (this === event.target) {
                        if (event.button !== 2) redirectEvent(event, this.parentNode)
                        handleNImgs(this);
                    }
                }
                nImg.addEventListener('click', handle, true);
                nImg.addEventListener('mousedown', handle, true);
                nImg.addEventListener('mouseup', handle, true);
                nImg.addEventListener('mousemove', handle, true);
                nImg.addEventListener('mouseover', handle, true);
                nImg.addEventListener('mouseout', handle, true);
                nImg.addEventListener('mouseenter', handle, true);
                nImg.addEventListener('mouseleave', handle, true);
                // nImg.addEventListener('wheel', handle, $.eh_capture_passive());
                let resObj = {
                    elm: nImg,
                    lastTime: +new Date,
                    cid_fade: 0
                }
                _nImgs.push(resObj)

                return nImg;

            }

            const wmHoverUrl = new WeakMap();
            /** @type {Node | null} */
            let lastMouseEnterElm = null;
            let lastMouseEnterAt = 0;
            let lastMouseEnterCid = 0;

            const mouseEnter = async (evt) => {

                if (!$.gm_disablehover_enable) return;
                lastMouseEnterElm = evt.target
                lastMouseEnterAt = +new Date;

                if (lastMouseEnterCid) return;
                lastMouseEnterCid = 1;
                do {
                    await new Promise(resolve => setTimeout(resolve, 82));
                } while (+new Date - lastMouseEnterAt < 30);
                lastMouseEnterCid = 0;

                // if($.lpKeyPressing)return;

                /** @type {Node | null} */
                const targetElm = lastMouseEnterElm

                await Promise.resolve();

                if (!targetElm || !targetElm.parentNode) {
                    return;
                }
                if (floatingBlockHover.get(targetElm)) {
                    let url = null
                    if (targetElm.getAttribute($.utHoverBlock) === '7' && (url = wmHoverUrl.get(targetElm)) && targetElm.querySelector(`[${$.utHoverBlock}]`) === null) {
                        let _nImg = nImgFunc();
                        if (_nImg.parentNode !== targetElm) {
                            _nImg.setAttribute('src', url);
                            targetElm.insertBefore(_nImg, targetElm.firstChild);
                        }
                    }
                    return;
                }
                floatingBlockHover.set(targetElm, 1);

                await Promise.resolve();

                if (!(targetElm instanceof Element)) return;
                // if (targetElm.nodeType !== 1) return;
                if ("|SVG|IMG|HTML|BODY|VIDEO|AUDIO|BR|HEAD|NOSCRIPT|SCRIPT|STYLE|TEXTAREA|AREA|INPUT|FORM|BUTTON|".indexOf(`|${targetElm.nodeName}|`) >= 0) return;

                const targetArea = targetElm.clientWidth * targetElm.clientHeight

                if (targetArea > 0) { } else {
                    return;
                }

                /** @type {string | null} */
                let sUrl = null;

                const targetCSS = getComputedStyle(targetElm)
                const targetBgImage = targetCSS.getPropertyValue('background-image') || '';
                let exec1 = null

                if (targetBgImage.length > 8 && (exec1 = /^\s*url\s*\("?([^"\)]+\b(\.gif|\.png|\.jpeg|\.jpg|\.webp)\b[^"\)]*)"?\)\s*$/i.exec(targetBgImage))) {
                    if ((targetElm.textContent || "").trim().length > 0) return;
                    const url = exec1[1];
                    sUrl = url;

                    // console.log(targetBgImage,[...exec1])
                } else {


                    if (targetCSS.getPropertyValue('position') === 'absolute' && +targetCSS.getPropertyValue('z-index') > 0) { } else {
                        return;
                    }
                    if ((targetElm.textContent || "").trim().length > 0) return;

                    let possibleResults = [];

                    for (const imgElm of document.querySelectorAll('img[src]')) {
                        const param = elmParam(imgElm)
                        if (!param.area) {
                            const area = imgElm.clientWidth * imgElm.clientHeight
                            if (area > 0) param.area = area;
                        }
                        if (param.area > 0) {
                            if (targetArea > param.area * 0.9) possibleResults.push(imgElm)
                        }
                    }

                    let i = 0;
                    let j = 0;
                    for (const imgElm of possibleResults) {

                        const cmpVal = targetElm.compareDocumentPosition(imgElm)

                        /*

                            1: The two nodes do not belong to the same document.
                            2: p1 is positioned after p2.
                            4: p1 is positioned before p2.
                            8: p1 is positioned inside p2.
                            16: p2 is positioned inside p1.
                            32: The two nodes has no relationship, or they are two attributes on the same element.

                        */

                        if (cmpVal & 8 || cmpVal & 16) return;
                        if (cmpVal & 2) j++; // I<p
                        else if (cmpVal & 4) break; // I>p


                        i++;

                    }

                    // before: j-1  after: j

                    let indexBefore = j - 1;
                    let indexAfter = j;
                    if (indexBefore < 0) indexBefore = 0;
                    if (indexAfter > possibleResults.length - 1) indexAfter = possibleResults.length - 1;

                    //    setTimeout(function(){
                    for (let i = indexBefore; i <= indexAfter; i++) {
                        const s = possibleResults[i];
                        const {
                            area1,
                            area2,
                            areaI
                        } = overlapArea(targetElm.getBoundingClientRect(), s.getBoundingClientRect())
                        // const criteria = area1 * 0.7
                        if (areaI > 0.9 * area2) {

                            sUrl = s.getAttribute('src');
                            break;

                        }
                    }
                    //   },1000);

                }




                if (typeof sUrl !== 'string') return;

                // console.log(targetElm, targetElm.querySelectorAll('img').length)

                // console.log(313, evt.target, s)
                let _nImg = nImgFunc();


                if (_nImg.parentNode !== targetElm) {
                    _nImg.setAttribute('src', sUrl);
                    targetElm.insertBefore(_nImg, targetElm.firstChild);
                    wmHoverUrl.set(targetElm, sUrl);
                    targetElm.setAttribute($.utHoverBlock, '7');
                }



            }

            document.addEventListener('mouseenter', mouseEnter, $.eh_capture_passive())



        },

        /** @type {EventListener} */
        acrAuxDown: (evt) => {

            if (!$.gm_prevent_aux_click_enable) return;

            if (evt.button === 1) {
                let check = $.dmmMouseUpLast > $.dmmMouseDownLast && evt.timeStamp - $.dmmMouseUpLast < 40
                $.dmmMouseDownLast = evt.timeStamp;
                if (check) {
                    $.eventCancel(evt, true);
                }
            }

        },

        /** @type {EventListener} */
        acrAuxUp: (evt) => {
            if (!$.gm_prevent_aux_click_enable) return;

            if (evt.button === 1) {
                let check = $.dmmMouseDownLast > $.dmmMouseUpLast && evt.timeStamp - $.dmmMouseDownLast < 40;
                $.dmmMouseUpLast = evt.timeStamp;
                if (check) {
                    $.dmmMouseUpCancel = evt.timeStamp;
                    $.eventCancel(evt, true);
                }
            }

        },


        /** @type {EventListener} */
        acrAuxClick: (evt) => {
            if (!$.gm_prevent_aux_click_enable) return;

            if (evt.button === 1) {
                if (evt.timeStamp - $.dmmMouseUpCancel < 40) {
                    $.eventCancel(evt, true);
                }
            }


        },

        // preventAuxClickRepeat: function () {

        //     const opt = $.eh_capture_active();
        //     // document.addEventListener('mousedown', $.acrAuxDown, opt)
        //     // document.addEventListener('mouseup', $.acrAuxUp, opt)
        //     document.addEventListener('auxclick', $.acrAuxClick, opt)


        // },

        mousedownFocus: (evt) => {
            focusNotAllowedUntil = Date.now() + 4;
        },

        mouseupFocus: (evt) => {
            focusNotAllowedUntil = 0;
        },

        MenuEnable: (
            class MenuEnable {

                /**
                 *
                 * @param {string} textToEnable
                 * @param {string} textToDisable
                 * @param {Function} callback
                 * @param {boolean?} initalEnable
                 */
                constructor(textToEnable, textToDisable, callback, initalEnable) {
                    /** @type {number|string|null} */
                    this.h = null;
                    /** @type {string} */
                    this.textToEnable = textToEnable;
                    /** @type {string} */
                    this.textToDisable = textToDisable;
                    /** @type {Function} */
                    this.callback = callback;
                    /** @type {Function} */
                    this.gx = this.gx.bind(this);
                }

                unregister() {
                    (this.h !== null) ? (GM_unregisterMenuCommand(this.h), (this.h = null)) : null;
                }

                register(text) {
                    if (typeof text === 'string') this.showText = text;
                    text = this.showText;
                    if (typeof text !== 'string') return;
                    this.h = GM_registerMenuCommand(text, this.gx);
                }

                a(o) {

                    if (this.enabled === o.bEnable) return;
                    this.enabled = o.bEnable;
                    this.unregister();


                    let pr = 0;

                    if ($.gm_status_fn_store && $.gm_status_fn_store.indexOf(this) >= 0) {

                        let store = $.gm_status_fn_store
                        let idx = store.indexOf(this)
                        let count = store.length;


                        if (idx >= 0 && idx <= count - 2) {

                            // console.log(idx, count)

                            for (let jdx = idx + 1; jdx < count; jdx++) {

                                store[jdx].unregister();
                            }

                            this.register(o.bText);

                            for (let jdx = idx + 1; jdx < count; jdx++) {

                                store[jdx].register();
                            }

                            pr = 1;

                        }


                    }

                    if (!pr) this.register(o.bText);

                    this.callback(this.enabled, o.byUserInput);


                }

                enableNow(byUserInput) {
                    this.a({
                        bEnable: true,
                        bText: this.textToDisable,
                        byUserInput
                    });

                }

                gx() {
                    if (this.enabled) this.disableNow(true);
                    else this.enableNow(true);

                }

                disableNow(byUserInput) {
                    this.a({
                        bEnable: false,
                        bText: this.textToEnable,
                        byUserInput
                    });

                }

                toggle(enable, byUserInput) {
                    enable ? this.enableNow(byUserInput) : this.disableNow(byUserInput);
                }

            }
        ),

        /**
         *
         * @param {string} gm_name
         * @param {string} textToEnable
         * @param {string} textToDisable
         * @param {Function} callback
         */
        gm_status_fn: async function (gm_name, textToEnable, textToDisable, callback) {

            const menuEnableName = gm_name + "$menuEnable";

            function set_gm(enabled) {
                $[gm_name] = enabled;
                const menuEnable = $[menuEnableName];
                if (menuEnable) {
                    menuEnable.toggle(enabled)
                };
                callback(enabled)
            }

            const gmValue = await GM.getValue(gm_name, false);
            set_gm(!!gmValue);

            GM_addValueChangeListener(gm_name, function (name, old_value, new_value, remote) {

                if (old_value === new_value || new_value === $[gm_name]) return;
                set_gm(new_value);

            });

            if (!inIframe()) {

                $.gm_status_fn_store = $.gm_status_fn_store || [];

                $[menuEnableName] = new $.MenuEnable(textToEnable, textToDisable, (enabled) => {
                    GM.setValue(gm_name, !!enabled);
                });

                $.gm_status_fn_store.push($[menuEnableName]);

                const gmValue = await GM.getValue(gm_name, false);
                $[menuEnableName].toggle(!!gmValue);

            }

        },

        /** @type {EventListener} */
        copyRangeCheckKeyDown(evt) {

            if (evt.isTrusted && (evt.key === 'Control' || evt.key === 'Meta')) {
                if (!(getSelection() + "")) {
                    $.rangeOnKeyDown = false;
                    return;
                }
                $.rangeOnKeyDown = true
            } else if (evt.isTrusted && ((evt.code === 'KeyC' && $.rangeOnKeyDown === true) || (evt.key === 'Copy'))) {
                $.rangeOnKeyDown = cloneRange();
            }

        },

        /** @type {EventListener} */
        copyRangeCheckKeyUp(evt) {

            if (evt.isTrusted && (evt.key === 'Control' || evt.key === 'Meta')) {
                $.rangeOnKeyDown = false;
            }
        },

        /** @type {EventListener} */
        genericEventHandlerLevel2: (evt) => {
            if ($.gm_absolute_mode) {
                // inspired by https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy
                evt.stopPropagation();
                evt.stopImmediatePropagation();
            }
            // .. and more

            const evtType = (evt || 0).type

            if (evtType === 'keydown') {
                $.copyRangeCheckKeyDown(evt);
            } else if (evtType === 'keyup') {
                $.copyRangeCheckKeyUp(evt);
            }

            if (evtType && $.enableReturnValueReplacment === true) {
                // $.listenerDisableAll(evt);
                let elmNode = evt.target;
                const pName = 'on' + evtType;
                let maxN = 99;
                while (elmNode instanceof Node) { // i.e. HTMLDocument or HTMLElement
                    if (--maxN < 4) break; // prevent unknown case
                    const f = elmNode[pName];
                    if (typeof f === 'function') {
                        let replacerId = f[$.ksFuncReplacerCounter];
                        if (replacerId > 0) break; // assume all parent functions are replaced; for performance only
                        // note: "return false" is preventDefault() in VanillaJS but preventDefault()+stopPropagation() in jQuery.
                        elmNode[pName] = $.weakMapFuncReplaced.get(f) || $.createFuncReplacer(f);
                    }
                    elmNode = elmNode.parentNode;
                }
            }

            if (evtType === 'contextmenu') {
                if (evt.defaultPrevented !== true) {
                    $.mainListenerPress(evt);
                }
            }

        },

        /** @type {EventListener} */
        genericEventHandlerLevel1: (evt) => {
            if ($.gm_absolute_mode) {
                // inspired by https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy
                evt.stopPropagation();
                evt.stopImmediatePropagation();
            }
            const evtType = (evt || 0).type
            if (evtType === 'mousedown') {
                $.mousedownFocus(evt);
                $.acrAuxDown(evt);
                if (evt.defaultPrevented !== true) {
                    $.mainListenerPress(evt);
                }
            } else if (evtType === 'mouseup') {
                $.mouseupFocus(evt);
                $.acrAuxUp(evt);
                if (evt.defaultPrevented !== true) {
                    $.mainListenerRelease(evt);
                }
            }
        },

        eventsInjection: function () {
            for (const s of ['keydown', 'keyup', 'copy', 'contextmenu', 'select', 'selectstart', 'dragstart', 'beforecopy']) {
                document.addEventListener(s, $.genericEventHandlerLevel2, true);
            }

            for (const s of ['cut', 'paste', 'mouseup', 'mousedown', 'drag', 'select']) {
                document.addEventListener(s, $.genericEventHandlerLevel1, true);
            }

            document.addEventListener('auxclick', $.acrAuxClick, true)
        },

        delayMouseUpTasksHandler: () => {
            if ($.delayMouseUpTasks > 0) {
                const flag = $.delayMouseUpTasks
                $.delayMouseUpTasks = 0;
                if ((flag & 1) === 1) $.mAlert_UP();
                if ((flag & 2) === 2 && $.enableDragging === true) $.enableDragging = false;
            }
        },

        mainListenerPress: (evt) => { // Capture Event; (mousedown - desktop; contextmenu - desktop&mobile)
            //   $.holdingElm=evt.target;
            //   console.log('down',evt.target)
            if ($.onceCssHighlightSelection) requestAnimationFrame($.onceCssHighlightSelection);
            const isContextMenuEvent = evt.type === "contextmenu";
            if (evt.button === 2 || isContextMenuEvent) $.mAlert_DOWN();
            if (isContextMenuEvent && $.delayMouseUpTasks === 0) {
                $.delayMouseUpTasks |= 1;
                requestAnimationFrame($.delayMouseUpTasksHandler)
            }
        },

        mainListenerRelease: (evt) => { // Capture Event; (mouseup - desktop)
            //  $.holdingElm=null;
            //   console.log('up',evt.target)
            if ($.delayMouseUpTasks === 0) { // skip if it is already queued
                if (evt.button === 2) $.delayMouseUpTasks |= 1;
                if ($.enableDragging === true) $.delayMouseUpTasks |= 2;
                if ($.delayMouseUpTasks > 0) {
                    requestAnimationFrame($.delayMouseUpTasksHandler)
                }
            }
        }


    }

    // $.holdingElm=null;
    $.eventsInjection();
    $.enableSelectClickCopy()
    $.injectCSSRules();

    if (isSupportAdvancedEventListener()) $.lpEnable(); // top capture event for alt-click

    $.disableHoverBlock();
    // $.preventAuxClickRepeat();

    console.log(`userscript running - ${SCRIPT_TAG}`);

    $.updateIsWindowEventSupported();

    if (typeof GM_registerMenuCommand === 'function' && typeof GM_unregisterMenuCommand === 'function') {

        if (isSupportAdvancedEventListener()) {
            $.gm_status_fn("gm_lp_enable", "To Enable `Enhanced build-in Alt Text Selection`", "To Disable `Enhanced build-in Alt Text Selection`", () => {
                // callback
            });
        }
        $.gm_status_fn("gm_disablehover_enable", "To Enable `Hover on Image`", "To Disable `Hover on Image`", () => {
            // callback
        });
        $.gm_status_fn("gm_prevent_aux_click_enable", "To Enable `Repetitive AuxClick Prevention`", "To Disable `Repetitive AuxClick Prevention`", () => {
            // callback
        });
        $.gm_status_fn("gm_absolute_mode", "To Enable `Absolute Mode`", "To Disable `Absolute Mode`", () => {
            // callback
        });

        $.gm_status_fn("gm_remain_focus_on_mousedown", "To Enable `Remain Focus On MouseDown`", "To Disable `Remain Focus On MouseDown`", () => {
            // $.gm_remain_focus_on_mousedown = 0;
            // callback
        });

        $.gm_status_fn("gm_native_video_audio_contextmenu", "To Enable Native Video Audio Context Menu", "To Disable Native Video Audio Context Menu", () => {

        })

    }

    if (typeof originalFocusFn === 'function' && HTMLElement.prototype.focus === originalFocusFn && originalFocusFn.length === 0) {
        const f = HTMLElement.prototype.focus = function () {
            if (focusNotAllowedUntil && $settings.gm_remain_focus_on_mousedown && focusNotAllowedUntil > Date.now()) return;
            return originalFocusFn.apply(this, arguments);
        }
        f.toString = originalFocusFn.toString.bind(originalFocusFn);
    }


})({ console });
//Redirect yt3.ggpht.com to yt4.ggpht.com (YouTube Avatars Fix), 1.0.5
(function() {
  'use strict';

  // Function to replace yt3.ggpht.com with yt4.ggpht.com in URLs
  function redirectURL(url) {
    return url.replace(/^https?:\/\/(yt3\.)?ggpht\.com/, 'https://yt4.ggpht.com');
  }

  // RequestListener
  function requestListener(details) {
    if (details.url.startsWith('https://yt3.ggpht.com/ytc/')) {
      return { redirectUrl: redirectURL(details.url) }
    } else if (details.url.startsWith('https://yt3.ggpht.com/')) {
      return { redirectUrl: redirectURL(details.url) }
    }
  }

  // Adding a request listener
  chrome.webRequest.onBeforeRequest.addListener(
    RequestListener,
    { urls: ['<all_urls>'] }
    ['blocking']
  );
})();
