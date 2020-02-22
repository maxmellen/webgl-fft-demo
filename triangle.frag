precision mediump float;
varying float v_g;

void main() {
  gl_FragColor = vec4(1.0, v_g, 0.5, 1.0);
}
