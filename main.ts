let canvas = document.getElementById("c") as HTMLCanvasElement;

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Could not find canvas.");
}

let gl = canvas.getContext("webgl") as WebGLRenderingContext;

if (!(gl instanceof WebGLRenderingContext)) {
  throw new Error("Could not get WebGL context.");
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

asyncMain();

function resizeCanvas(): void {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  if (window.devicePixelRatio > 1) {
    canvas.width *= window.devicePixelRatio;
    canvas.height *= window.devicePixelRatio;
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

async function asyncMain(): Promise<void> {
  let [{ vert, frag }, vertices] = await Promise.all([
    fetchShaderSources(),
    fetchTriangleVertices()
  ]);

  let program = compileProgram(gl, vert, frag);
  let aPositionLocation = gl.getAttribLocation(program, "a_position");
  let vertexBuffer = gl.createBuffer();

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(aPositionLocation);
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

  window.requestAnimationFrame(drawScene);
}

async function fetchShaderSources(): Promise<{ vert: string; frag: string }> {
  let [vert, frag] = await Promise.all(
    ["./triangle.vert", "./triangle.frag"].map(path =>
      fetch(path).then(resp => resp.text())
    )
  );

  return { vert, frag };
}

async function fetchTriangleVertices(): Promise<Float32Array> {
  return fetch("./triangle.json")
    .then(resp => resp.json())
    .then(doc => {
      if (!isValidTriangleVerticesDoc(doc)) throw new Error("Invalid format.");
      return Float32Array.from(doc.points.flat());
    });
}

function isValidTriangleVerticesDoc(
  doc: unknown
): doc is { points: number[][] } {
  if (typeof doc !== "object" || !doc) return false;
  if (!Array.isArray((doc as any).points)) return false;
  return ((doc as any).points as unknown[]).every(vertex => {
    if (!Array.isArray(vertex)) return false;
    return vertex.every(component => typeof component === "number");
  });
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

function drawScene(): void {
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.requestAnimationFrame(drawScene);
}
