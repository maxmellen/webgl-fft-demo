attribute vec2 a_position;
varying float v_g;

void main() {
  gl_Position = vec4((a_position * 2.0) - 1.0, 0.0, 1.0);
  v_g = a_position.y;
}
