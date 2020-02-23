import { waitForFileData } from "./filePrompt.js";
import { init as initAudio } from "./audio.js";
import { init as initGraphics } from "./graphics.js";
asyncMain();
async function asyncMain() {
    let audioData = await waitForFileData();
    let audioUtils = await initAudio({ audioData, fftSize: 2048 });
    let graphicsUtils = initGraphics();
    setupDrawLoop(Object.assign(Object.assign({}, audioUtils), graphicsUtils));
}
function setupDrawLoop(utils) {
    let { getFrequencyData, drawVertices } = utils;
    let positions;
    function updateVertices() {
        let frequencyData = getFrequencyData();
        positions = positions !== null && positions !== void 0 ? positions : new Float32Array(frequencyData.length * 4);
        for (let i = 0; i < frequencyData.length; i++) {
            let j = i * 4;
            let x = i / frequencyData.length;
            positions[j] = x;
            positions[j + 1] = frequencyData[i];
            positions[j + 2] = x;
            positions[j + 3] = 0;
        }
    }
    function drawLoop() {
        updateVertices();
        drawVertices(positions);
        window.requestAnimationFrame(drawLoop);
    }
    window.requestAnimationFrame(drawLoop);
}
