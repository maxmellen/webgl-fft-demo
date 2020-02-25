let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioData;
let audioCtx;
let audioSource;
let fileInput = q(HTMLInputElement, "#file-input");
let fileReader = new FileReader();
fileInput.addEventListener("click", () => {
    audioCtx = audioCtx !== null && audioCtx !== void 0 ? audioCtx : new AudioContext();
    if (audioSource)
        audioSource.stop();
    audioSource = audioCtx.createBufferSource();
});
fileInput.addEventListener("change", () => {
    var _a;
    let file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file)
        return;
    fileInput.disabled = true;
    fileReader.readAsArrayBuffer(file);
});
fileReader.addEventListener("load", e => {
    audioData = fileReader.result;
    audioCtx.decodeAudioData(audioData, decodeSuccessCallback, decodeErrorCallback);
});
fileReader.addEventListener("error", () => {
    console.error("Could not read file:", fileReader.error);
});
function decodeSuccessCallback(buffer) {
    audioSource.buffer = buffer;
    audioSource.connect(audioCtx.destination);
    audioSource.start();
    fileInput.disabled = false;
}
function decodeErrorCallback(error) {
    console.error("Could not decode audio:", error);
    fileInput.disabled = false;
}
function q(constructor, selector) {
    let element = document.querySelector(selector);
    if (!(element instanceof constructor)) {
        throw new Error(`${constructor.name} "${selector}" not found.`);
    }
    return element;
}
