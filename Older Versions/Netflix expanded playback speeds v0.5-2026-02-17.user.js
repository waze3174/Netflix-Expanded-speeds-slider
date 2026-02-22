// ==UserScript==
// @name         Netflix expanded playback speeds v0.5
// @namespace    http://tampermonkey.net/
// @version      2026-02-17
// @description  try to take over the world!
// @author       Waze3174
// @match        https://www.netflix.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=netflix.com
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    const STORAGE_KEY = 'netflix_playback_speed';

    function setSpeed(speed) {
        var video = document.querySelector('video');
        if (video) video.playbackRate = speed;
        localStorage.setItem(STORAGE_KEY, speed);
    }

    function restoreSpeed(video) {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && video) video.playbackRate = parseFloat(saved);
    }

    function makeButton(label, speed) {
        var btn = document.createElement("button");
        btn.innerHTML = label;
        btn.style.cssText = "color: #000 !important";
        btn.addEventListener("click", function() { setSpeed(speed); });
        return btn;
    }

    var buttonx2  = makeButton("x2",        2);
    var buttonx3  = makeButton("x3",        3);
    var buttonx4  = makeButton("x4",        4);
    var buttonx5  = makeButton("x5",        5);
    var buttonx6  = makeButton("x6",        6);
    var buttonx7  = makeButton("x7",        7);
    var buttonx8  = makeButton("x8",        8);
    var buttonx9  = makeButton("x9 🔇",     9);
    var buttonx10 = makeButton("x10 🔇",   10);

    var buttons = [buttonx2, buttonx3, buttonx4, buttonx5, buttonx6, buttonx7, buttonx8, buttonx9, buttonx10];

    function appendButtons(netspeedwindow) {
        buttons.forEach(function(btn) { netspeedwindow.appendChild(btn); });
    }

    var netspeedwindow = document.querySelector("[data-uia='playback-speed']");
    if (netspeedwindow !== "undefined" && netspeedwindow !== null) {
        appendButtons(netspeedwindow);
    }

    var lastVideo = null;

    var mo = new MutationObserver(function(mo) {
        var netspeedwindow = document.querySelector("[data-uia='playback-speed']");
        if (netspeedwindow !== "undefined" && netspeedwindow !== null) {
            appendButtons(netspeedwindow);
        }

        var video = document.querySelector('video');
        if (video && video !== lastVideo) {
            lastVideo = video;
            restoreSpeed(video);
        }
    });
    mo.observe(document, {
        attributeOldValue: true,
        subtree: true,
    });
})();