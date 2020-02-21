let canvas = document.getElementById("c") as HTMLCanvasElement;

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Could not find canvas.");
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function resizeCanvas(): void {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  if (window.devicePixelRatio > 1) {
    canvas.width *= window.devicePixelRatio;
    canvas.height *= window.devicePixelRatio;
  }
}
