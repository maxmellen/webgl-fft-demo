asyncMain();
async function asyncMain() {
    let canvas = document.getElementById("c");
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error("Could not find canvas.");
    }
    let { getFreqData } = await initAudio({ fftSize: 512 });
    let graphicsServicesAndUtils = await initGraphics(canvas);
    let { updateVertices, draw } = graphicsServicesAndUtils;
    let { resizeViewportToCanvas } = graphicsServicesAndUtils;
    autoResizeCanvas(canvas, { resizeViewportToCanvas });
    setupDrawLoop({ getFreqData, updateVertices, draw });
}
function autoResizeCanvas(canvas, { resizeViewportToCanvas }) {
    let resizeCanvas = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        if (window.devicePixelRatio > 1) {
            canvas.width *= window.devicePixelRatio;
            canvas.height *= window.devicePixelRatio;
        }
        resizeViewportToCanvas();
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
}
async function initAudio(opts) {
    let userAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
    let ctx = new (window.AudioContext || window.webkitAudioContext)();
    let audioSource = ctx.createMediaStreamSource(userAudio);
    let analyser = ctx.createAnalyser();
    let freqData = new Float32Array(opts.fftSize);
    let { minDecibels, maxDecibels } = analyser;
    let deltaDecibels = maxDecibels - minDecibels;
    analyser.fftSize = opts.fftSize;
    audioSource.connect(analyser);
    function getFreqData() {
        analyser.getFloatFrequencyData(freqData);
        for (let i = 0; i < freqData.length; i++) {
            freqData[i] = freqData[i]
                ? (freqData[i] - minDecibels) / deltaDecibels
                : 0;
        }
        return freqData;
    }
    return { getFreqData };
}
async function initGraphics(canvas) {
    let gl = canvas.getContext("webgl");
    if (!gl) {
        throw new Error("Could not create WebGL context.");
    }
    let { vert, frag } = await fetchShaderSources();
    let program = compileProgram(gl, vert, frag);
    let aPositionLocation = gl.getAttribLocation(program, "a_position");
    let vertexBuffer = gl.createBuffer();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
    return {
        updateVertices(data) {
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        },
        draw(count) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
        },
        resizeViewportToCanvas() {
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    };
}
async function fetchShaderSources() {
    let [vert, frag] = await Promise.all(["./fft.vert", "./fft.frag"].map(path => fetch(path).then(resp => resp.text())));
    return { vert, frag };
}
function compileProgram(gl, vert, frag) {
    let vertShader = compileShader(gl, gl.VERTEX_SHADER, vert);
    let fragShader = compileShader(gl, gl.FRAGMENT_SHADER, frag);
    let program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let infoLog = gl.getProgramInfoLog(program);
        throw new Error(`Could not compile program:\n${infoLog}`);
    }
    return program;
}
function compileShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let infoLog = gl.getShaderInfoLog(shader);
        throw new Error(`Could not compile shader:\n${infoLog}`);
    }
    return shader;
}
function setupDrawLoop(deps) {
    let { getFreqData, updateVertices, draw } = deps;
    let vertices;
    function drawScene() {
        let freqData = getFreqData();
        let effectiveFreqDataLen = freqData.length / 2;
        vertices = vertices !== null && vertices !== void 0 ? vertices : new Float32Array(freqData.length * 4);
        for (let i = 0; i < effectiveFreqDataLen; i++) {
            let j = i * 4;
            let x = i / effectiveFreqDataLen;
            vertices[j] = x;
            vertices[j + 1] = freqData[i];
            vertices[j + 2] = x;
            vertices[j + 3] = 0;
        }
        updateVertices(vertices);
        draw(vertices.length / 2);
        window.requestAnimationFrame(drawScene);
    }
    window.requestAnimationFrame(drawScene);
}
