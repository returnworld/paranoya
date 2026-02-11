// game of life shader
//
// An example sketch showing the p5.filterShader library
// https://github.com/BarneyWhiteman/p5.filterShader

let golShader;
let stateBuffer;

// load in the shader
function preload() {
  golShader = loadShader('gol.vert', 'gol.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  background(0);
  
  stroke(255);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("SAVE MY LOVE", width/2, height/2);
}

function draw() {
  // Draw a line on the canvas if the mouse is pressed
  if(mouseIsPressed) {
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
  
  // Apply the game of life shader
  // Note: we didn't clear the canvas or draw a background
  // so the output of the last shader is fed into the input
  // of the next shader, allowing the simulation to work
  filterShader(golShader);
}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   background(0);
// }