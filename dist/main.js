let audioData;
let audioCtx;
let audioSource;
let fileInput = q(HTMLInputElement, "#file-input");
let playButton = q(HTMLButtonElement, "#play-button");
let fileReader = new FileReader();
fileInput.addEventListener("change", () => {
    var _a;
    let file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file)
        return;
    fileReader.readAsArrayBuffer(file);
});
fileReader.addEventListener("load", e => {
    audioData = fileReader.result;
    playButton.disabled = false;
});
fileReader.addEventListener("error", () => {
    console.error("Could not read file:", fileReader.error);
});
playButton.addEventListener("click", () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioSource = audioCtx.createBufferSource();
    audioCtx.decodeAudioData(audioData, decodeSuccessCallback, decodeErrorCallback);
});
function decodeSuccessCallback(buffer) {
    audioSource.buffer = buffer;
    audioSource.connect(audioCtx.destination);
    audioSource.start();
}
function decodeErrorCallback(error) {
    console.error("Could not decode audio:", error);
}
function q(constructor, selector) {
    let element = document.querySelector(selector);
    if (!(element instanceof constructor)) {
        throw new Error(`${constructor.name} "${selector}" not found.`);
    }
    return element;
}
