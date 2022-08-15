/*
TODO:
- Axes
- Help on inputs
- Audio
- Make all ids and class names camelCase
- Scrollable wave plots
  - Auto scroll when animation playing
- Fix layout
- Zoom/prevent amplitudes greater than 1
- Piano keyboard?
- Deal with canvas resize
- Display more accurate wave plots at high frequencies
- Increase default plot length for non-integer frequencies
- Customiseable upper limit of xFreq for drawing static plot
- Reset button
- Do not attempt to redraw entire plot while quickly scrolling oscillator properties if it is a large plot
- Compute samples once
- Customisable base waveforms
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
let audio, audioLen, source;
let f = Math.sin;

const presets = {
    "Harmonics": {
        unison: {title: "Unison", xFreq: 1, yFreq: 1},
        octave: {title: "Octave", xFreq: 1, yFreq: 2},
        overtone2: {title: "Second overtone", xFreq: 1, yFreq: 3},
        overtone3: {title: "Third overtone", xFreq: 1, yFreq: 4},
        overtone4: {title: "Fourth overtone", xFreq: 1, yFreq: 5},
    },
    "Seconds": {
        lesserMajorSecond5: {title: "Lesser major second (5-limit)", xFreq: 9, yFreq: 10},
        majorSecond35: {title: "Greater major second (3,5-limit)", xFreq: 8, yFreq: 9},
        majorSecond7: {title: "Major second (7-limit)", xFreq: 7, yFreq: 8},
        majorSecond12TET: {title: "Major second (12TET)", xFreq: 1, yFreq: Math.pow(2, 2/12)},

        chromaticSemitone3: {title: "Chromatic semitone (3-limit)", xFreq: 2048, yFreq: 2187},
        diatonicSemitone3: {title: "Diatonic semitone (3-limit)", xFreq: 243, yFreq: 256},
        lesserChromaticSemitone5: {title: "Lesser chromatic semitone (5-limit)", xFreq: 24, yFreq: 25},
        greaterChromaticSemitone5: {title: "Greater chromatic semitone (5-limit)", xFreq: 128, yFreq: 135},
        lesserDiatonicSemitone5: {title: "Lesser diatonic semitone (5-limit)", xFreq: 15, yFreq: 16},
        greaterDiatonicSemitone: {title: "Greater diatonic semitone (5-limit)", xFreq: 25, yFreq: 27},
        chromaticSemitone7: {title: "Chromatic semitone (7-limit)", xFreq: 20, yFreq: 21},
        diatonicSemitone7: {title: "Diatonic semitone (7-limit)", xFreq: 14, yFreq: 15},
        minorSecond12TET: {title: "Minor second (12TET)", xFreq: 1, yFreq: Math.pow(2, 1/12)},
    },
    "Thirds": {
        majorThird3: {title: "Major third (3-limit)", xFreq: 64, yFreq: 81},
        majorThird5: {title: "Major third (5-limit)", xFreq: 4, yFreq: 5},
        majorThird7: {title: "Major third (7-limit)", xFreq: 7, yFreq: 9},
        majorThird12TET: {title: "Major third (12TET)", xFreq: 1, yFreq: Math.pow(2, 4/12)},

        minorThird3: {title: "Minor third (3-limit)", xFreq: 27, yFreq: 32},
        minorThird5: {title: "Minor third (5-limit)", xFreq: 5, yFreq: 6},
        minorThird7: {title: "Minor third (7-limit)", xFreq: 7, yFreq: 6},
        minorThird12TET: {title: "Minor third (12TET)", xFreq: 1, yFreq: Math.pow(2, 3/12)},
    },
    "Fourths": {
        wolfFourth5: {title: "Wolf fourth (5-limit)", xFreq: 20, yFreq: 27},
        perfectFourth357: {title: "Perfect fourth (3,5,7-limit)", xFreq: 3, yFreq: 4},
        perfectFourth12TET: {title: "Perfect fourth (12TET)", xFreq: 1, yFreq: Math.pow(2, 5/12)},
    },
    "Tritones": {
        lesserTritone3: {title: "Lesser tritone (3-limit)", xFreq: 729, yFreq: 1024},
        greaterTritone3: {title: "Greater tritone (3-limit)", xFreq: 512, yFreq: 729},
        lesserTritone5: {title: "Lesser tritone (5-limit)", xFreq: 32, yFreq: 45},
        greaterTritone5: {title: "Greater tritone (5-limit)", xFreq: 45, yFreq: 64},
        lesserTritone7: {title: "Lesser tritone (7-limit)", xFreq: 5, yFreq: 7},
        greaterTritone7: {title: "Greater tritone (7-limit)", xFreq: 7, yFreq: 10},
        tritone12TET: {title: "Tritone (12TET)", xFreq: 1, yFreq: Math.pow(2, 6/12)}
    },
    "Fifths": {
        wolfFifth5: {title: "Wolf fifth (5-limit)", xFreq: 27, yFreq: 40},
        perfectFifth357: {title: "Perfect fifth (3,5,7-limit)", xFreq: 2, yFreq: 3},
        perfectFifth12TET: {title: "Perfect fifth (12TET)", xFreq: 1, yFreq: Math.pow(2, 7/12)},
    },
    "Sixths": {
        majorSixth3: {title: "Major sixth (3-limit)", xFreq: 16, yFreq: 27},
        majorSixth5: {title: "Major sixth (5-limit)", xFreq: 3, yFreq: 5},
        majorSixth7: {title: "Major sixth (7-limit)", xFreq: 7, yFreq: 12},
        majorSixth12TET: {title: "Major sixth (12TET)", xFreq: 1, yFreq: Math.pow(2, 9/12)},

        minorSixth3: {title: "Minor sixth (3-limit)", xFreq: 81, yFreq: 128},
        minorSixth5: {title: "Minor sixth (5-limit)", xFreq: 5, yFreq: 8},
        minorSixth7: {title: "Minor sixth (7-limit)", xFreq: 9, yFreq: 14},
        minorSixth12TET: {title: "Minor sixth (12TET)", xFreq: 1, yFreq: Math.pow(2, 8/12)},
    },
    "Sevenths": {
        majorSeventh3: {title: "Major seventh (3-limit)", xFreq: 128, yFreq: 243},
        majorSeventh5: {title: "Major seventh (5-limit)", xFreq: 8, yFreq: 15},
        majorSeventh7: {title: "Major seventh (7-limit)", xFreq: 14, yFreq: 27},
        majorSeventh12TET: {title: "Major seventh (12TET)", xFreq: 1, yFreq: Math.pow(2, 11/12)},

        lesserMinorSeventh35: {title: "Lesser minor seventh (3,5-limit)", xFreq: 9, yFreq: 16},
        minorSeventh5: {title: "Greater minor seventh (5-limit)", xFreq: 5, yFreq: 9},
        minorSeventh7: {title: "Minor seventh (7-limit)", xFreq: 4, yFreq: 7},
        minorSeventh12TET: {title: "Minor seventh (12TET)", xFreq: 1, yFreq: Math.pow(2, 10/12)},
    },
    "Commas": {
        schisma: {title: "Schisma", xFreq: 32768, yFreq: 32805},
        diaschisma: {title: "Diaschisma", xFreq: 2025, yFreq: 2045},
        syntonicComma: {title: "Syntonic comma", xFreq: 80, yFreq: 81},
        pythagoreanComma: {title: "Pythagorean comma", xFreq: 524288, yFreq: 531441},
    }
};

let rachel = false;

function fade(c, a) {
    return 255-(255-c)*a;
}

function getColourComponents(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
        const prevPoint = trail[i-1];
        const point = trail[i];
        if (prevPoint[2] && point[2]) { // Visible
            ctx.moveTo(prevPoint[0], prevPoint[1]);
            ctx.lineTo(point[0], point[1]);
        }
        ctx.stroke();
    }
}

function getPos(t) {
    if (!rachel) {
        const x = Math.pow((1-xDamp), t) * xAmp * f(t + xPhase * 2 * Math.PI) * (w-10)/2 + (w)/2;
        const y = Math.pow((1-yDamp), t) * yAmp * f(yFreq/xFreq * t + yPhase * 2 * Math.PI) * (h-10)/2 + (h)/2;
        return [x, y, true];
    } else {
        t = t - Math.floor(t);
        if (t < 0.7) {
            const point = rachel_animation_2[Math.floor(t/0.7*rachel_animation_2.length)];
            return [point[0] * (w-10) * 1.2, point[1] * (h-10) + 20, true];
        } else if (t < 0.75) {
            return [0, 0, false];
        } else if (t < 0.95) {
            const point = rachel_animation_1[Math.floor((t-0.75)/0.2*rachel_animation_1.length)];
            return [point[0] * (w-10) + 160, point[1] * (h-50) + 40, true];
        } else {
            return [0, 0, false];
        }
    }
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

    const truncWarn = document.getElementById("trunc-warn");
    truncWarn.textContent = "";
    truncWarn.title = "";

    stepInterval = setInterval(step, 20);

    plotWaves();
}

function sawtooth(t) {
    return ( (t % 1) -.5);
}

function custom_instrument(t) {
    return Math.tanh(t/20) * Math.pow(0.999, t) * (
        Math.sin(t) + Math.sin(2*t)/4 + Math.sin(3*t)/9 + Math.sin(5*t)/25 + Math.sin(6*t)/36
    );
}

function square(t) {
    return Math.sign(Math.sin(t));
}

const freqs = {
    "B2": 123.471,
    "C3": 130.813,
    "D3": 146.832,
    "E3": 164.814,
    "F3": 174.614,
    "G3": 195.998,
    "A3": 220,
    "A#3": 233.082,
    "C4": 261.626,
    "G4": 391.995,
    "A4": 440,
    "B4": 493.883,
    "C5": 523.251,
    "D5": 587.33,
    "E5": 659.255,
    "F5": 698.456,
    "G5": 783.991,
};

function addNote(buf, name, len, time, bps, f, volume) {
    const rate = audio.sampleRate;
    for (let t = 0; t < len*rate; t++) {
        buf[time/bps*rate+t] += volume*f(freqs[name] * t/rate * 2 * Math.PI);
    }
}

function playAudio() {
    const play = document.getElementById("play");
    play.value = "Stop";
    play.removeEventListener("click", playAudio);
    play.addEventListener("click", stopAudio);

    let buf;
    const rate = audio.sampleRate;
    if (!rachel) {
        buf = new Float32Array(audioLen);
        const freqBase = 1000; // TODO customiseable
        const ampBase = 0.25;
        for (let t = 0; t < audioLen; t++) {
            const x = Math.pow((1-xDamp), t) * xAmp * f(freqBase * t / rate + xPhase * 2 * Math.PI);
            const y = Math.pow((1-yDamp), t) * yAmp * f(yFreq/xFreq * freqBase * t / rate + yPhase * 2 * Math.PI);
            buf[t] = ampBase * (x+y);
        }
    } else {
        const bps = 2;
        buf = new Float32Array(rate*24/bps);
        addNote(buf, "G4", 0.5, 0, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 0.5, 0.5, bps, custom_instrument, 0.3);
        addNote(buf, "A4", 1, 1, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 1, 2, bps, custom_instrument, 0.3);
        addNote(buf, "C5", 1, 3, bps, custom_instrument, 0.3);
        addNote(buf, "B4", 2, 4, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 0.5, 6, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 0.5, 6.5, bps, custom_instrument, 0.3);
        addNote(buf, "A4", 1, 7, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 1, 8, bps, custom_instrument, 0.3);
        addNote(buf, "D5", 1, 9, bps, custom_instrument, 0.3);
        addNote(buf, "C5", 2, 10, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 0.5, 12, bps, custom_instrument, 0.3);
        addNote(buf, "G4", 0.5, 12.5, bps, custom_instrument, 0.3);
        addNote(buf, "G5", 1, 13, bps, custom_instrument, 0.3);
        addNote(buf, "E5", 1, 14, bps, custom_instrument, 0.3);
        addNote(buf, "C5", 1, 15, bps, custom_instrument, 0.3);
        addNote(buf, "B4", 1, 16, bps, custom_instrument, 0.3);
        addNote(buf, "A4", 1, 17, bps, custom_instrument, 0.3);
        addNote(buf, "F5", 0.5, 18, bps, custom_instrument, 0.3);
        addNote(buf, "F5", 0.5, 18.5, bps, custom_instrument, 0.3);
        addNote(buf, "E5", 1, 19, bps, custom_instrument, 0.3);
        addNote(buf, "C5", 1, 20, bps, custom_instrument, 0.3);
        addNote(buf, "D5", 1, 21, bps, custom_instrument, 0.3);
        addNote(buf, "C5", 1, 22, bps, custom_instrument, 0.3);

        addNote(buf, "C3", 2, 1, bps, custom_instrument, 0.2);
        addNote(buf, "E3", 2, 1, bps, custom_instrument, 0.2);
        addNote(buf, "G3", 2, 1, bps, custom_instrument, 0.2);

        addNote(buf, "D3", 2, 4, bps, custom_instrument, 0.2);
        addNote(buf, "F3", 2, 4, bps, custom_instrument, 0.2);
        addNote(buf, "G3", 2, 4, bps, custom_instrument, 0.2);

        addNote(buf, "B2", 2, 7, bps, custom_instrument, 0.2);
        addNote(buf, "F3", 2, 7, bps, custom_instrument, 0.2);
        addNote(buf, "G3", 2, 7, bps, custom_instrument, 0.2);

        addNote(buf, "C3", 2, 10, bps, custom_instrument, 0.2);
        addNote(buf, "E3", 2, 10, bps, custom_instrument, 0.2);
        addNote(buf, "G3", 2, 10, bps, custom_instrument, 0.2);

        addNote(buf, "E3", 2, 13, bps, custom_instrument, 0.2);
        addNote(buf, "A#3", 2, 13, bps, custom_instrument, 0.2);
        addNote(buf, "C4", 2, 13, bps, custom_instrument, 0.2);

        addNote(buf, "F3", 2, 16, bps, custom_instrument, 0.2);
        addNote(buf, "A3", 2, 16, bps, custom_instrument, 0.2);
        addNote(buf, "C4", 2, 16, bps, custom_instrument, 0.2);

        addNote(buf, "E3", 2, 19, bps, custom_instrument, 0.2);
        addNote(buf, "G3", 2, 19, bps, custom_instrument, 0.2);
        addNote(buf, "C4", 2, 19, bps, custom_instrument, 0.2);

        addNote(buf, "G3", 2, 21, bps, custom_instrument, 0.2);
        addNote(buf, "F3", 2, 21, bps, custom_instrument, 0.2);
        addNote(buf, "D3", 2, 21, bps, custom_instrument, 0.2);

        addNote(buf, "C3", 2, 22, bps, custom_instrument, 0.2);
        addNote(buf, "E3", 2, 22, bps, custom_instrument, 0.2);
        addNote(buf, "G3", 2, 22, bps, custom_instrument, 0.2);
    }
    let buffer = audio.createBuffer(1, buf.length, rate)
    buffer.copyToChannel(buf, 0)
    source = audio.createBufferSource();
    source.buffer = buffer;
    source.addEventListener("ended", stopAudio);
    source.connect(audio.destination);
    source.start();
}

function stopAudio() {
    const play = document.getElementById("play");
    play.value = "Play";
    play.removeEventListener("click", stopAudio);
    play.addEventListener("click", playAudio);
    source.stop();
}

function plot() {
    reset();
    mode = "plot";

    ctx.lineWidth = 1;
    ctx.strokeStyle = plotCol;

    const truncWarn = document.getElementById("trunc-warn");
    if (xFreq > 100) {
        truncWarn.textContent = "This plot may be truncated";
        truncWarn.title = "This plot may appear truncated for performance reasons, due to a high x frequency. You may increase the plot length to see more of the plot, at the expense of render time.";
    } else if (!Number.isInteger(xFreq) || !Number.isInteger(yFreq)) {
        truncWarn.textContent = "This plot may be truncated";
        truncWarn.title = "This plot may appear truncated because the frequencies are not both whole numbers. You may increase the plot length to see more of the plot, at the expense of render time.";
    } else if (xDamp > 0 || yDamp > 0) {
        truncWarn.textContent = "This plot may be truncated";
        truncWarn.title = "This plot may appear truncated because the system is damped. You may increase the plot length to see more of the plot, at the expense of render time.";
    } else {
        truncWarn.textContent = "";
        truncWarn.title = "";
    }

    let t = 0;
    ctx.beginPath();
    let prevPoint = [0, 0, false];
    while (t <= plotLen * 2 * Math.PI * Math.min(xFreq, 100) + plotRes) {
        t += plotRes;
        const point = getPos(t);
        if (prevPoint[2] && point[2]) { // Visible
            ctx.lineTo(point[0], point[1]);
        } else {
            ctx.moveTo(point[0], point[1]);
        }
        prevPoint = point;
    }
    ctx.stroke();

    plotWaves();
}

function plotWaves() {
    w1ctx.strokeStyle = plotCol;
    w2ctx.strokeStyle = plotCol;
    w3ctx.strokeStyle = plotCol;

    if (!rachel) {
        let w1ys = [], w2ys = [];
        w1ctx.beginPath();
        for (let x = 0; x < ww; x++) {
            const t = x / 10; // TODO: customisable frequency scaling
            const y = Math.pow((1-xDamp), t) * xAmp * f(t + xPhase * 2 * Math.PI) * (wh-10)/4;
            w1ctx.lineTo(x, -y + wh/2);
            w1ys.push(y);
        }
        w1ctx.stroke();

        w2ctx.beginPath();
        for (let x = 0; x < ww; x++) {
            const t = x / 10; // TODO: customisable frequency scaling
            const y = Math.pow((1-yDamp), t) * yAmp * f(yFreq/xFreq * t + yPhase * 2 * Math.PI) * (wh-10)/4;
            w2ctx.lineTo(x, -y + wh/2);
            w2ys.push(y);
        }
        w2ctx.stroke();

        w3ctx.beginPath();
        for (let x = 0; x < ww; x++) {
            w3ctx.lineTo(x, -(w1ys[x] + w2ys[x]) + wh/2);
        }
        w3ctx.stroke();
    } else {
        const txts = ["Happy", "Birthday", "Rachel"];
        const ctxs = [w1ctx, w2ctx, w3ctx];
        for (let n = 0; n < 3; n++) {
            const ctx = ctxs[n];
            for (let i = 0; i < txts[n].length; i++) {
                const c = txts[n].charAt(i);
                const letter = letters[c];
                const pos = letter_pos[n][i];
                for (let stroke of letter) {
                    ctx.beginPath();
                    for (let j = 0; j < stroke.length; j++) {
                        ctx.lineTo(stroke[j][0]*pos.w+pos.x, stroke[j][1]*pos.h+pos.y);
                    }
                    ctx.stroke();
                }
            }
        }
    }
}

function readValues() {
    const wasRachel = rachel;
    rachel = document.getElementById("rachel-on").checked;

    if (rachel) {
        document.getElementById("colour").value = "#00357A";
        document.querySelectorAll("input[type='number'], input[type='colour'], select").forEach(input => {
            input.disabled = "disabled";
        });
    } else if (wasRachel && !rachel) {
        document.getElementById("colour").value = "#660000";
        document.querySelectorAll("input[type='number'], input[type='colour'], select").forEach(input => {
            input.removeAttribute("disabled");
        });
    }

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
    audioLen = parseFloat(document.getElementById("audio-len").value) * audio.sampleRate;

    const canvases = document.querySelectorAll("canvas");
    canvases.forEach(canvas => {
        canvas.style.borderColor = plotCol;
    });

    const fieldsets = document.querySelectorAll("fieldset");
    fieldsets.forEach(fieldset => {
        fieldset.style.borderColor = plotCol;
    });

    const legends = document.querySelectorAll("legend");
    legends.forEach(legend => {
        legend.style.backgroundColor = plotCol;
    });

    const buttons = document.querySelectorAll("input[type=\"button\"]");
    buttons.forEach(button => {
        button.style.backgroundColor = plotCol;
        button.style.borderColor = plotCol;
    });
}

function loadPreset(group, preset) {
    xFreq = presets[group][preset].xFreq;
    yFreq = presets[group][preset].yFreq;
    document.getElementById("x-freq").value = xFreq;
    document.getElementById("y-freq").value = yFreq;
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

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audio = new AudioContext();

    const presetList = document.getElementById("preset-list");
    for (const [group, list] of Object.entries(presets)) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = group;
        for (const [key, properties] of Object.entries(list)) {
            const opt = document.createElement("option");
            opt.id = key;
            opt.value = key;
            opt.className = "preset";
            opt.appendChild(document.createTextNode(properties["title"]));
            optgroup.appendChild(opt);
        }
        presetList.appendChild(optgroup);
    }
    presetList.addEventListener("change", (event) => {
        const id = event.target.value;
        const group = document.getElementById(id).parentElement.label;
        loadPreset(group, id);
    });

    document.getElementById("animate").addEventListener("click", animate);
    document.getElementById("plot").addEventListener("click", plot);
    document.querySelectorAll(".plot-update").forEach((input) => {
        input.addEventListener("change", () => {
            if (mode === "animate") { animate(); }
            else if (mode === "plot") { plot(); }
        });
    });

    document.getElementById("play").addEventListener("click", playAudio);

    loadPreset("Harmonics", "unison");
    animate();
}

document.addEventListener("DOMContentLoaded", init, false);
