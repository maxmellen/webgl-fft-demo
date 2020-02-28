import { initialize as initAudio } from "./audio.js";
import { initialize as initGraphics } from "./graphics.js";

asyncMain();

async function asyncMain() {
  let { getFrequencyData } = await initAudio();
  let { draw } = initGraphics();

  let drawLoop = () => {
    draw(getFrequencyData());
    window.requestAnimationFrame(drawLoop);
  };

  window.requestAnimationFrame(drawLoop);
}

export {};
