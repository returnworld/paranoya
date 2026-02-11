#ifdef GL_ES
precision mediump float;
#endif

// Pixel position
varying vec2 pos;

// Uniforms set by filterShader
uniform sampler2D filter_background; // contains the image being filtered
uniform vec2 filter_res; // contains the image resolution in pixels


void main() {
  // Figure out how far a pixel is
  vec2 normalRes = 1./filter_res;
  
  // Get colour of current pixel
  vec3 col = texture2D(filter_background, pos).rgb;
  
  // Read colours of neighbour pixels
  vec3 neighbours = vec3(0., 0., 0.);
  for(float i = -1.; i < 2.; i++) {
    for(float j = -1.; j < 2.; j++) {
      float x = pos.x + i * normalRes.x;
      float y = pos.y + j * normalRes.y;

      neighbours += texture2D(filter_background, vec2(x, y)).rgb;
    }
  }
  
  // Remove current pixel from neighbours
  neighbours -= col;
  
  // Game of Life rules implemented with Maths =)
  vec3 alive = step(0.5, col);
  vec3 two_n = step(2., neighbours);
  vec3 three_n = step(3., neighbours);
  vec3 four_n = step(4., neighbours);
  
  col = (1. - four_n) * (three_n + (alive * two_n));
  
  // Output the cell (white = alive, black = dead)
  gl_FragColor = vec4(col, 1.);
}