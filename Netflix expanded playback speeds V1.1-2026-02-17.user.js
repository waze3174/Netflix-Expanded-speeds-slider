// ==UserScript==
// @name         Netflix expanded playback speeds V1.1
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
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 4, 5, 6, 7, 8, 9, 10];
    const THUMB_HALF = 10;

    function speedToIndex(speed) {
        var closest = 0;
        var diff = Infinity;
        SPEEDS.forEach(function(s, i) {
            if (Math.abs(s - speed) < diff) { diff = Math.abs(s - speed); closest = i; }
        });
        return closest;
    }

    var style = document.createElement("style");
    style.innerHTML = `
        #neps-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 16px; background: transparent; outline: none; cursor: pointer; }
        #neps-slider::-webkit-slider-runnable-track { height: 16px; background: rgba(255,255,255,0.3); border-radius: 8px; }
        #neps-slider::-moz-range-track { height: 16px; background: rgba(255,255,255,0.3); border-radius: 8px; }
        #neps-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; cursor: pointer; margin-top: -2px; }
        #neps-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; cursor: pointer; border: none; }
        #neps-tick-row { position: relative; width: 100%; height: 8px; margin-top: 4px; box-sizing: border-box; }
        #neps-tick-row span { position: absolute; width: 2px; height: 8px; background: rgba(255,255,255,0.5); transform: translateX(-50%); }
    `;
    document.head.appendChild(style);

    var sliderContainer = document.createElement("div");
    sliderContainer.style.cssText = "display: flex; flex-direction: column; align-items: center; padding: 16px 28px 20px; width: 100%; box-sizing: border-box;";

    var headerRow = document.createElement("div");
    headerRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 14px;";

    var titleBlock = document.createElement("div");
    titleBlock.style.cssText = "display: flex; flex-direction: column;";

    var title = document.createElement("div");
    title.style.cssText = "color: #fff; font-weight: bold; font-size: 15px;";
    title.innerHTML = "Expanded Speed Selection";

    var subtitle = document.createElement("div");
    subtitle.style.cssText = "color: rgba(255,255,255,0.5); font-size: 12px;";
    subtitle.innerHTML = "By Waze3174 &nbsp;·&nbsp; v1.1";

    titleBlock.appendChild(title);
    titleBlock.appendChild(subtitle);

    var speedLabelWrapper = document.createElement("div");
    speedLabelWrapper.style.cssText = "display: flex; flex-direction: column; align-items: flex-end;";

    var speedLabelTitle = document.createElement("div");
    speedLabelTitle.style.cssText = "color: rgba(255,255,255,0.5); font-size: 12px;";
    speedLabelTitle.innerHTML = "Current Speed";

    var speedLabel = document.createElement("div");
    speedLabel.style.cssText = "color: #fff; font-weight: bold; font-size: 26px;";

    speedLabelWrapper.appendChild(speedLabelTitle);
    speedLabelWrapper.appendChild(speedLabel);

    headerRow.appendChild(titleBlock);
    headerRow.appendChild(speedLabelWrapper);

    var slider = document.createElement("input");
    slider.type = "range";
    slider.id = "neps-slider";
    slider.min = 0;
    slider.max = SPEEDS.length - 1;
    slider.step = 1;

    var tickRow = document.createElement("div");
    tickRow.id = "neps-tick-row";
    SPEEDS.forEach(function(s, i) {
        var tick = document.createElement("span");
        var pct = i / (SPEEDS.length - 1);
        tick.style.left = "calc(" + THUMB_HALF + "px + " + pct + " * (100% - " + (THUMB_HALF * 2) + "px))";
        tickRow.appendChild(tick);
    });

    var tickContainer = document.createElement("div");
    tickContainer.style.cssText = "display: grid; grid-template-columns: repeat(" + SPEEDS.length + ", 1fr); width: 100%; margin-top: 6px; letter-spacing: -0.5px;";
    SPEEDS.forEach(function(s, i) {
        var tick = document.createElement("span");
        tick.innerHTML = s;
        var align = i === 0 ? "left" : i === SPEEDS.length - 1 ? "right" : "center";
        tick.style.cssText = "color: #fff; font-size: 13px; text-align: " + align + ";";
        tickContainer.appendChild(tick);
    });

    sliderContainer.appendChild(headerRow);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(tickRow);
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

    function addHoverGrace(element) {
        var closeTimer = null;
        element.addEventListener("mouseleave", function(e) {
            e.stopPropagation();
            closeTimer = setTimeout(function() {
                closeTimer = null;
            }, 1500);
        }, true);
        element.addEventListener("mouseenter", function() {
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        }, true);
    }

    function injectIntoSlider(netspeedwindow) {
        if (injected && netspeedwindow.contains(sliderContainer)) return;
        injected = true;

        Array.from(netspeedwindow.children).forEach(function(child) {
            if (child !== sliderContainer) child.style.display = "none";
        });

        netspeedwindow.appendChild(sliderContainer);

        addHoverGrace(netspeedwindow);
        var parent = netspeedwindow.closest("[data-uia='watch-video-speed-controls']");
        if (parent) addHoverGrace(parent);
        if (parent && parent.parentElement) addHoverGrace(parent.parentElement);
        if (parent && parent.parentElement && parent.parentElement.parentElement) addHoverGrace(parent.parentElement.parentElement);

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