import { q } from "./domUtils.js";

export interface Services {
  draw(data: Readonly<Uint8Array>): void;
}

let vertGlsl = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
  }
`;

let fragGlsl = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;

  void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
  }
`;

let positions = Float32Array.of(-1, 1, -1, -1, 1, 1, 1, -1);
let texcoords = Float32Array.of(0, 1, 0, 0, 1, 1, 1, 0);

export function initialize(): Services {
  let canvas = q<HTMLCanvasElement>("#c")!;
  let gl = canvas.getContext("webgl")!;
  let program = compileProgram(gl, vertGlsl, fragGlsl);

  let resizeCanvas = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if (window.devicePixelRatio > 1) {
      canvas.width *= window.devicePixelRatio;
      canvas.height *= window.devicePixelRatio;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  window.addEventListener("resize", resizeCanvas);
  window.setTimeout(resizeCanvas);

  let vertexBuffer = gl.createBuffer();
  let texcoordBuffer = gl.createBuffer();
  let texture = gl.createTexture();
  let positionAttribLoc = gl.getAttribLocation(program, "a_position");
  let texcoordAttribLoc = gl.getAttribLocation(program, "a_texcoord");
  let textureUniformLoc = gl.getUniformLocation(program, "u_texture");

  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttribLoc);
  gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texcoordAttribLoc);
  gl.vertexAttribPointer(texcoordAttribLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.uniform1i(textureUniformLoc, 0);

  return {
    draw(data: Uint8Array) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE,
        data.byteLength,
        1,
        0,
        gl.LUMINANCE,
        gl.UNSIGNED_BYTE,
        data
      );

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  };
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
