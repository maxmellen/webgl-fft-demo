attribute vec2 a_position;
uniform mat2 u_rotation;
uniform vec2 u_offset;
varying float v_g;

void main() {
  gl_Position = vec4(u_rotation * a_position + u_offset, 0.0, 1.0);
  v_g = (gl_Position.y + 1.0) / 2.0;
}
