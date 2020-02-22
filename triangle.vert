attribute vec2 a_position;
uniform mat2 u_rotation;

void main() {
  gl_Position = vec4(u_rotation * a_position, 0.0, 1.0);
}
