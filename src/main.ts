declare global {
  var webkitAudioContext: typeof window.AudioContext;
}

let fileInput = q(HTMLInputElement, "#file-input");
let canvas = q(HTMLCanvasElement, "#c");
let fileReader = new FileReader();

let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioData: ArrayBuffer | undefined;
let audioCtx: AudioContext | undefined;
let audioAnalyser: AnalyserNode | undefined;
let audioSource: AudioBufferSourceNode | undefined;

let freqData: Float32Array | undefined;
let positions: Float32Array | undefined;

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

{
  let vertGlsl = `
    attribute vec2 a_position;
    varying float v_g;
    
    void main() {
      gl_Position = vec4((a_position * 2.0) - 1.0, 0.0, 1.0);
      v_g = a_position.y;
    }
  `;

  let fragGlsl = `
    precision mediump float;
    varying float v_g;
    
    void main() {
      gl_FragColor = vec4(1.0, v_g, 0.5, 1.0);
    }
  `;

  let program = compileProgram(gl, vertGlsl, fragGlsl);
  let aPositionLocation = gl.getAttribLocation(program, "a_position");
  let vertexBuffer = gl.createBuffer();

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.enableVertexAttribArray(aPositionLocation);
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
}

fileInput.addEventListener("click", () => {
  audioCtx = audioCtx ?? new AudioContext();
  audioAnalyser = audioAnalyser ?? audioCtx.createAnalyser();
  if (audioSource) audioSource.stop();
  audioSource = audioCtx.createBufferSource();
  audioSource!.connect(audioAnalyser!).connect(audioCtx!.destination);
});

fileInput.addEventListener("change", () => {
  let file = fileInput.files?.[0];
  if (!file) return;
  fileInput.disabled = true;
  fileReader.readAsArrayBuffer(file);
});

fileReader.addEventListener("load", e => {
  audioData = fileReader.result as ArrayBuffer;
  audioCtx!.decodeAudioData(
    audioData,
    decodeSuccessCallback,
    decodeErrorCallback
  );
});

fileReader.addEventListener("error", () => {
  console.error("Could not read file:", fileReader.error!);
});

function decodeSuccessCallback(buffer: AudioBuffer) {
  audioSource!.buffer = buffer;
  audioSource!.start();
  fileInput.disabled = false;
}

function decodeErrorCallback(error: any) {
  console.error("Could not decode audio:", error);
  fileInput.disabled = false;
}

window.requestAnimationFrame(function draw() {
  if (audioAnalyser) {
    let { frequencyBinCount, minDecibels, maxDecibels } = audioAnalyser;
    freqData = freqData ?? new Float32Array(frequencyBinCount);
    positions = positions ?? new Float32Array(freqData.length * 4);

    audioAnalyser.getFloatFrequencyData(freqData);

    for (let i = 0; i < freqData.length; i++) {
      let j = i * 4;
      let x = i / freqData.length;
      let normalized =
        (freqData[i] - minDecibels) / (maxDecibels - minDecibels);

      positions[j] = x;
      positions[j + 1] = normalized;
      positions[j + 2] = x;
      positions[j + 3] = 0;
    }

    gl!.bufferData(gl!.ARRAY_BUFFER, positions, gl!.DYNAMIC_DRAW);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, positions.length / 2);
  }

  window.requestAnimationFrame(draw);
});

function q<T extends HTMLElement>(
  constructor: { new (): T },
  selector: string
): T {
  let element = document.querySelector(selector);
  if (!(element instanceof constructor)) {
    throw new Error(`${constructor.name} "${selector}" not found.`);
  }
  return element;
}

function compileProgram(
  gl: WebGLRenderingContext,
  vertGlsl: string,
  fragGlsl: string
): WebGLProgram {
  let vertShader = compileShader(gl, gl.VERTEX_SHADER, vertGlsl);
  let fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragGlsl);
  let program = gl.createProgram()!;

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    let infoLog = gl.getProgramInfoLog(program);
    throw new Error(`Could not compile program:\n${infoLog}`);
  }

  return program;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  let shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let infoLog = gl.getShaderInfoLog(shader);
    throw new Error(`Could not compile shader:\n${infoLog}`);
  }

  return shader;
}

export {};
