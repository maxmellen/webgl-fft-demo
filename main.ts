interface InitAudioOptions {
  fftSize: number;
}

interface AudioServices {
  getFreqData(): Readonly<Float32Array>;
}

interface GraphicsServices {
  setVerticesBufferData(data: Float32Array): void;
  drawVertices(count: number): void;
}

interface GraphicsUtils {
  resizeViewportToCanvas(): void;
}

type DrawSceneDeps = AudioServices & GraphicsServices;

asyncMain();

async function asyncMain(): Promise<void> {
  let canvas = document.getElementById("c");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Could not find canvas.");
  }

  let [audioServices, graphicsServicesAndUtils] = await Promise.all([
    initAudio({ fftSize: 512 }),
    initGraphics(canvas)
  ]);

  autoResizeCanvas(canvas, graphicsServicesAndUtils);
  setupDrawLoop({ ...audioServices, ...graphicsServicesAndUtils });
}

async function initAudio(opts: InitAudioOptions): Promise<AudioServices> {
  let userAudio = await navigator.mediaDevices.getUserMedia({ audio: true });
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let audioSource = ctx.createMediaStreamSource(userAudio);
  let analyser = ctx.createAnalyser();
  let freqData = new Float32Array(opts.fftSize);
  let { minDecibels, maxDecibels } = analyser;
  let deltaDecibels = maxDecibels - minDecibels;

  analyser.fftSize = opts.fftSize;
  audioSource.connect(analyser);

  function getFreqData(): Readonly<Float32Array> {
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

async function initGraphics(
  canvas: HTMLCanvasElement
): Promise<GraphicsServices & GraphicsUtils> {
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
    setVerticesBufferData(data: Float32Array): void {
      gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.DYNAMIC_DRAW);
    },
    drawVertices(count: number): void {
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, count);
    },
    resizeViewportToCanvas(): void {
      gl!.viewport(0, 0, gl!.canvas.width, gl!.canvas.height);
    }
  };
}

async function fetchShaderSources(): Promise<{ vert: string; frag: string }> {
  let [vert, frag] = await Promise.all(
    ["./fft.vert", "./fft.frag"].map(path =>
      fetch(path).then(resp => resp.text())
    )
  );

  return { vert, frag };
}

function compileProgram(
  gl: WebGLRenderingContext,
  vert: string,
  frag: string
): WebGLProgram {
  let vertShader = compileShader(gl, gl.VERTEX_SHADER, vert);
  let fragShader = compileShader(gl, gl.FRAGMENT_SHADER, frag);
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

function autoResizeCanvas(
  canvas: HTMLCanvasElement,
  { resizeViewportToCanvas }: GraphicsUtils
): void {
  let resizeCanvas = (): void => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (window.devicePixelRatio > 1) {
      canvas.width *= window.devicePixelRatio;
      canvas.height *= window.devicePixelRatio;
    }

    resizeViewportToCanvas();
  };

  window.addEventListener("resize", resizeCanvas);
  window.setTimeout(resizeCanvas);
}

function setupDrawLoop(deps: DrawSceneDeps): void {
  let { getFreqData, setVerticesBufferData, drawVertices } = deps;
  let vertices: Float32Array | undefined;

  function drawLoop(): void {
    let freqData = getFreqData();
    vertices = updateVertices(vertices, freqData);
    setVerticesBufferData(vertices);
    drawVertices(vertices.length / 2);
    window.requestAnimationFrame(drawLoop);
  }

  window.requestAnimationFrame(drawLoop);
}

function updateVertices(
  vertices: Float32Array | undefined,
  freqData: Readonly<Float32Array>
): Float32Array {
  vertices = vertices ?? new Float32Array(freqData.length * 4);

  // Seems the second half of the data is always 0 ¯\_(ツ)_/¯
  let effectiveFreqDataLen = freqData.length / 2;

  for (let i = 0; i < effectiveFreqDataLen; i++) {
    let j = i * 4;
    let x = i / effectiveFreqDataLen;
    vertices[j] = x;
    vertices[j + 1] = freqData[i];
    vertices[j + 2] = x;
    vertices[j + 3] = 0;
  }

  return vertices;
}

export {};
