import { waitForFileData } from "./filePrompt.js";
import { init as initAudio, Utils as AudioUtils } from "./audio.js";
import { init as initGraphics, Utils as GraphicsUtils } from "./graphics.js";

asyncMain();

async function asyncMain(): Promise<void> {
  let audioData = await waitForFileData();
  let audioUtils = await initAudio({ audioData, fftSize: 2048 });
  let graphicsUtils = initGraphics();
  setupDrawLoop({ ...audioUtils, ...graphicsUtils });
}

function setupDrawLoop(utils: AudioUtils & GraphicsUtils): void {
  let { getFrequencyData, drawVertices } = utils;
  let positions: Float32Array | undefined;

  function updateVertices() {
    let frequencyData = getFrequencyData();
    positions = positions ?? new Float32Array(frequencyData.length * 4);

    for (let i = 0; i < frequencyData.length; i++) {
      let j = i * 4;
      let x = i / frequencyData.length;
      positions[j] = x;
      positions[j + 1] = frequencyData[i];
      positions[j + 2] = x;
      positions[j + 3] = 0;
    }
  }

  function drawLoop(): void {
    updateVertices();
    drawVertices(positions!);
    window.requestAnimationFrame(drawLoop);
  }

  window.requestAnimationFrame(drawLoop);
}
