/*
TODO:
- presets
- optimise
- Axes
- Help on inputs
- Audio
- Make all ids and class names camelCase
- Make all phase shifts of presets the same
- Scrollable wave plots
  - Auto scroll when animation playing
- Fix layout
- Zoom/prevent amplitudes greater than 1
- Piano keyboard?
- Better preset selection
- Select presets using keyboard
*/

let stepInterval;
let ctx, w, h, w1ctx, w2ctx, w3ctx, ww, wh;
let t, dt, plotRes;
let trail, trailLen, plotLen;
let xFreq, yFreq;
let xAmp, yAmp;
let xPhase, yPhase;
let xDamp, yDamp;
let r, g, b, trailCols, plotCol;
let mode;

const presets = {
    unisonOpen: {title: "Unison (open)", xFreq: 1, yFreq: 1, xPhase: 0.25, yPhase: 0},
    unisonClosed: {title: "Unison (closed)", xFreq: 1, yFreq: 1, xPhase: 0, yPhase: 0},
    octaveOpen: {title: "Octave (open)", xFreq: 1, yFreq: 2, xPhase: 0, yPhase: 0},
    octaveClosed: {title: "Octave (closed)", xFreq: 1, yFreq: 2, xPhase: 0, yPhase: 0.25},
    perfectFifthOpen: {title: "Perfect fifth (open)", xFreq: 2, yFreq: 3, xPhase: 0, yPhase: 0},
    perfectFifthClosed: {title: "Perfect fifth (closed)", xFreq: 2, yFreq: 3, xPhase: 0.25, yPhase: 0},
    perfectFourthOpen: {title: "Perfect fourth (open)", xFreq: 3, yFreq: 4, xPhase: 0, yPhase: 0},
    perfectFourthClosed: {title: "Perfect fourth (closed)", xFreq: 3, yFreq: 4, xPhase: 0, yPhase: 0.25},
    majorSixthOpen: {title: "Major sixth (open)", xFreq: 3, yFreq: 5, xPhase: 0.25, yPhase: 0},
    majorSixthClosed: {title: "Major sixth (closed)", xFreq: 3, yFreq: 5, xPhase: 0, yPhase: 0},
    majorThirdOpen: {title: "Major third (open)", xFreq: 4, yFreq: 5, xPhase: 0, yPhase: 0},
    majorThirdClosed: {title: "Major third (closed)", xFreq: 4, yFreq: 5, xPhase: 0.25, yPhase: 0},
    minorThirdOpen: {title: "Minor third (open)", xFreq: 5, yFreq: 6, xPhase: 0, yPhase: 0},
    minorThirdClosed: {title: "Minor third (closed)", xFreq: 5, yFreq: 6, xPhase: 0, yPhase: 0.25},
    minorSixthOpen: {title: "Minor sixth (open)", xFreq: 5, yFreq: 8, xPhase: 0, yPhase: 0},
    minorSixthClosed: {title: "Minor sixth (closed)", xFreq: 5, yFreq: 8, xPhase: 0, yPhase: 0.25},
};

function fade(c, a) {
    return 255-(255-c)*a;
}

function getColourComponents(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);
}

function redraw() {
    const dlen = trailLen - trail.length;
    ctx.clearRect(0, 0, w, h);
    for (let i = 1; i < trail.length; i++) {
        ctx.strokeStyle = trailCols[i+dlen];
        ctx.beginPath();
        ctx.moveTo(...trail[i-1]);
        ctx.lineTo(...trail[i]);
        ctx.stroke();
    }
}

function getPos(t) {
    const x = Math.pow((1-xDamp), t) * xAmp * Math.sin(xFreq * t + xPhase * 2 * Math.PI) * (w-10)/2 + (w)/2;
    const y = Math.pow((1-yDamp), t) * yAmp * Math.sin(yFreq * t + yPhase * 2 * Math.PI) * (h-10)/2 + (h)/2;
    return [x, y];
}

function step() {
    t += dt;
    if (trail.length == trailLen) {
        trail.shift();
    }
    trail.push(getPos(t));
    redraw();
}

function animate() {
    reset();
    mode = "animate";

    ctx.lineWidth = 4;

    stepInterval = setInterval(step, 20);

    plotWaves();
}

function plot() {
    reset();
    mode = "plot";

    ctx.lineWidth = 1;
    ctx.strokeStyle = plotCol;

    let t = 0;
    ctx.beginPath();
    while (t <= plotLen) {
        t += plotRes;
        ctx.lineTo(...getPos(t));
    }
    ctx.stroke();

    plotWaves();
}

function plotWaves() {
    w1ctx.strokeStyle = plotCol;
    w2ctx.strokeStyle = plotCol;
    w3ctx.strokeStyle = plotCol;

    let w1ys = [], w2ys = [];

    w1ctx.beginPath();
    for (let x = 0; x < ww; x++) {
        const t = x / 20; // TODO: customisable frequency scaling
        const y = Math.pow((1-xDamp), t) * xAmp * Math.sin(xFreq * t + xPhase * 2 * Math.PI) * (wh-10)/4;
        w1ctx.lineTo(x, -y + wh/2);
        w1ys.push(y);
    }
    w1ctx.stroke();

    w2ctx.beginPath();
    for (let x = 0; x < ww; x++) {
        const t = x / 20; // TODO: customisable frequency scaling
        const y = Math.pow((1-yDamp), t) * yAmp * Math.sin(yFreq * t + yPhase * 2 * Math.PI) * (wh-10)/4;
        w2ctx.lineTo(x, -y + wh/2);
        w2ys.push(y);
    }
    w2ctx.stroke();

    w3ctx.beginPath();
    for (let x = 0; x < ww; x++) {
        w3ctx.lineTo(x, -(w1ys[x] + w2ys[x]) + wh/2);
    }
    w3ctx.stroke();
}

function readValues() {
    getColourComponents(document.getElementById("colour").value);
    plotCol = document.getElementById("colour").value;
    trailLen = parseInt(document.getElementById("trail-len").value);
    plotLen = parseFloat(document.getElementById("plot-len").value);
    xFreq = parseFloat(document.getElementById("x-freq").value);
    yFreq = parseFloat(document.getElementById("y-freq").value);
    xAmp = parseFloat(document.getElementById("x-amp").value);
    yAmp = parseFloat(document.getElementById("y-amp").value);
    xDamp = parseFloat(document.getElementById("x-damp").value);
    yDamp = parseFloat(document.getElementById("y-damp").value);
    xPhase = parseFloat(document.getElementById("x-phase").value);
    yPhase = parseFloat(document.getElementById("y-phase").value);
    dt = parseFloat(document.getElementById("dt").value);
    plotRes = parseFloat(document.getElementById("plot-res").value);
}

function loadPreset(preset) {
    xFreq = presets[preset]["xFreq"];
    yFreq = presets[preset]["yFreq"];
    xPhase = presets[preset]["xPhase"];
    yPhase = presets[preset]["yPhase"];
    document.getElementById("x-freq").value = xFreq;
    document.getElementById("y-freq").value = yFreq;
    document.getElementById("x-phase").value = xPhase;
    document.getElementById("y-phase").value = yPhase;
    if (mode == "animate") animate();
    else if (mode == "plot") plot();
}

function reset() {
    if (stepInterval) {
        clearInterval(stepInterval);
    }
    ctx.clearRect(0, 0, w, h);
    w1ctx.clearRect(0, 0, ww, wh);
    w2ctx.clearRect(0, 0, ww, wh);
    w3ctx.clearRect(0, 0, ww, wh);
    readValues();
    t = 0;
    trail = [];
    trailCols = [];
    for (let i = 1; i < trailLen; i++) {
        const a = (i+1)/trailLen;
        trailCols.push("rgb(" + fade(r, a) + "," + fade(g, a) + "," + fade(b, a) + ")");
    }
}

function init() {
    const cvs = document.getElementById("cvs");
    ctx = cvs.getContext("2d");
    w = cvs.width;
    h = cvs.height;

    const w1cvs = document.getElementById("w1-cvs");
    w1ctx = w1cvs.getContext("2d");
    const style = window.getComputedStyle(w1cvs);
    ww = parseInt(style.width);
    wh = parseInt(style.height);

    const w2cvs = document.getElementById("w2-cvs");
    w2ctx = w2cvs.getContext("2d");

    const w3cvs = document.getElementById("w3-cvs");
    w3ctx = w3cvs.getContext("2d");

    w1cvs.width = ww;
    w2cvs.width = ww;
    w3cvs.width = ww;

    ctx.lineCap = "round";
    w1ctx.lineCap = "round";
    w2ctx.lineCap = "round";
    w3ctx.lineCap = "round";
    w1ctx.lineWidth = 1;
    w2ctx.lineWidth = 1;
    w3ctx.lineWidth = 1;

    const presetList = document.getElementById("preset-list");
    for (const [key, value] of Object.entries(presets)) {
        const opt = document.createElement("option");
        opt.id = key;
        opt.value = key;
        opt.className = "preset";
        opt.addEventListener("click", function () { loadPreset(key); } );
        opt.appendChild(document.createTextNode(value["title"]));
        presetList.appendChild(opt);
    }

    document.getElementById("animate").addEventListener("click", animate);
    document.getElementById("plot").addEventListener("click", plot);
    document.querySelectorAll(".plot-update").forEach(function (input) {
        input.addEventListener("change", function () {
            if (mode === "animate") { animate(); }
            else if (mode === "plot") { plot(); }
        });
    });

    animate();
}

document.addEventListener("DOMContentLoaded", init, false);
