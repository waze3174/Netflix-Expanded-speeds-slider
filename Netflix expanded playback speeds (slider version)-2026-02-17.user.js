// ==UserScript==
// @name         Netflix expanded playback speeds V1 (slider version)
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
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10];

    function speedToIndex(speed) {
        var closest = 0;
        var diff = Infinity;
        SPEEDS.forEach(function(s, i) {
            if (Math.abs(s - speed) < diff) { diff = Math.abs(s - speed); closest = i; }
        });
        return closest;
    }

    var sliderContainer = document.createElement("div");
    sliderContainer.style.cssText = "display: flex; flex-direction: column; align-items: center; padding: 36px 40px; width: 100%; box-sizing: border-box;";

    var speedLabel = document.createElement("div");
    speedLabel.style.cssText = "color: #fff; font-weight: bold; margin-bottom: 20px; font-size: 30px;";

    var datalist = document.createElement("datalist");
    datalist.id = "speed-ticks";
    SPEEDS.forEach(function(s, i) {
        var option = document.createElement("option");
        option.value = i;
        datalist.appendChild(option);
    });

    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = 0;
    slider.max = SPEEDS.length - 1;
    slider.step = 1;
    slider.setAttribute("list", "speed-ticks");
    slider.style.cssText = "width: 100%; accent-color: #fff; cursor: pointer; height: 4px;";

    var tickContainer = document.createElement("div");
    tickContainer.style.cssText = "display: grid; grid-template-columns: repeat(" + SPEEDS.length + ", 1fr); width: 100%; margin-top: 8px;";
    SPEEDS.forEach(function(s) {
        var tick = document.createElement("span");
        tick.innerHTML = s;
        tick.style.cssText = "color: #fff; font-size: 17px; text-align: center;";
        tickContainer.appendChild(tick);
    });

    sliderContainer.appendChild(speedLabel);
    sliderContainer.appendChild(datalist);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(tickContainer);

    function updateLabel(speed) {
        speedLabel.innerHTML = speed + "x" + (speed >= 9 ? " 🔇" : "");
    }

    function setSpeed(speed) {
        var video = document.querySelector('video');
        if (video) video.playbackRate = speed;
        localStorage.setItem(STORAGE_KEY, speed);
        updateLabel(speed);
        slider.value = speedToIndex(speed);
    }

    function restoreSpeed(video) {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved && video) {
            var speed = parseFloat(saved);
            video.playbackRate = speed;
            updateLabel(speed);
            slider.value = speedToIndex(speed);
        }
    }

    slider.addEventListener("input", function() {
        setSpeed(SPEEDS[parseInt(slider.value)]);
    });

    var injected = false;

    function blockMouseLeave(e) {
        e.stopPropagation();
    }

    function injectIntoSlider(netspeedwindow) {
        if (injected && netspeedwindow.contains(sliderContainer)) return;
        injected = true;

        Array.from(netspeedwindow.children).forEach(function(child) {
            if (child !== sliderContainer) child.style.display = "none";
        });

        netspeedwindow.appendChild(sliderContainer);

        netspeedwindow.addEventListener("mouseleave", blockMouseLeave, true);
        var parent = netspeedwindow.closest("[data-uia='watch-video-speed-controls']");
        if (parent) parent.addEventListener("mouseleave", blockMouseLeave, true);

        var video = document.querySelector('video');
        if (video) restoreSpeed(video);
        else updateLabel(1);
    }

    var netspeedwindow = document.querySelector("[data-uia='playback-speed']");
    if (netspeedwindow !== "undefined" && netspeedwindow !== null) {
        injectIntoSlider(netspeedwindow);
    }

    var lastVideo = null;

    var mo = new MutationObserver(function() {
        var netspeedwindow = document.querySelector("[data-uia='playback-speed']");
        if (netspeedwindow !== "undefined" && netspeedwindow !== null) {
            injectIntoSlider(netspeedwindow);
        }

        var video = document.querySelector('video');
        if (video && video !== lastVideo) {
            lastVideo = video;
            injected = false;
            restoreSpeed(video);
        }
    });
    mo.observe(document, {
        attributeOldValue: true,
        subtree: true,
    });
})();
