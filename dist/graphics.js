import { $$$ } from "./domUtils.js";
const VERT_GLSL = `
attribute vec2 a_position;
varying float v_g;

void main() {
  gl_Position = vec4((a_position * 2.0) - 1.0, 0.0, 1.0);
  v_g = a_position.y;
}
`;
const FRAG_GLSL = `precision mediump float;
varying float v_g;

void main() {
  gl_FragColor = vec4(1.0, v_g, 0.5, 1.0);
}
`;
export function init() {
    let canvas = $$$(HTMLCanvasElement, "c");
    let gl = canvas.getContext("webgl");
    if (!gl) {
        throw new Error("Could not create WebGL context.");
    }
    autoResizeCanvas(gl);
    setupProgram(gl);
    return {
        drawVertices(data) {
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, data.length / 2);
        }
    };
}
function autoResizeCanvas(gl) {
    let canvas = gl.canvas;
    let resizeCanvas = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        if (window.devicePixelRatio > 1) {
            canvas.width *= window.devicePixelRatio;
            canvas.height *= window.devicePixelRatio;
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };
    window.addEventListener("resize", resizeCanvas);
    window.setTimeout(resizeCanvas);
}
function setupProgram(gl) {
    let program = compileProgram(gl, VERT_GLSL, FRAG_GLSL);
    let aPositionLocation = gl.getAttribLocation(program, "a_position");
    let vertexBuffer = gl.createBuffer();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
}
function compileProgram(gl, vertGlsl, fragGlsl) {
    let vertShader = compileShader(gl, gl.VERTEX_SHADER, vertGlsl);
    let fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragGlsl);
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
