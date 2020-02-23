export async function init(options) {
    let { audioData, fftSize } = options;
    let ctx = new (window.AudioContext || window.webkitAudioContext)();
    let audioBuffer = await new Promise((resolve, reject) => {
        ctx.decodeAudioData(audioData, resolve, reject);
    });
    let source = ctx.createBufferSource();
    let analyser = ctx.createAnalyser();
    source.buffer = audioBuffer;
    analyser.fftSize = fftSize;
    source.connect(analyser).connect(ctx.destination);
    source.start();
    let { frequencyBinCount, minDecibels, maxDecibels } = analyser;
    let frequencyData = new Float32Array(frequencyBinCount);
    let rangeDecibels = maxDecibels - minDecibels;
    function getFrequencyData() {
        analyser.getFloatFrequencyData(frequencyData);
        for (let i = 0; i < frequencyData.length; i++) {
            frequencyData[i] = (frequencyData[i] - minDecibels) / rangeDecibels;
        }
        return frequencyData;
    }
    return { getFrequencyData };
}
