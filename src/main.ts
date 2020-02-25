declare global {
  var webkitAudioContext: typeof AudioContext;
}

let audioData: ArrayBuffer;
let audioCtx: AudioContext;
let audioSource: AudioBufferSourceNode;
let fileInput = q(HTMLInputElement, "#file-input");
let playButton = q(HTMLButtonElement, "#play-button");
let fileReader = new FileReader();

fileInput.addEventListener("change", () => {
  let file = fileInput.files?.[0];
  if (!file) return;
  fileReader.readAsArrayBuffer(file);
});

fileReader.addEventListener("load", e => {
  audioData = fileReader.result as ArrayBuffer;
  playButton.disabled = false;
});

fileReader.addEventListener("error", () => {
  console.error("Could not read file:", fileReader.error!);
});

playButton.addEventListener("click", () => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioSource = audioCtx.createBufferSource();
  audioCtx.decodeAudioData(
    audioData!,
    decodeSuccessCallback,
    decodeErrorCallback
  );
});

function decodeSuccessCallback(buffer: AudioBuffer) {
  audioSource.buffer = buffer;
  audioSource.connect(audioCtx.destination);
  audioSource.start();
}

function decodeErrorCallback(error: any) {
  console.error("Could not decode audio:", error);
}

function q<T extends HTMLElement>(
  constructor: { new (): T },
  selector: string
): T {
  let element = document.querySelector(selector);
  if (!(element instanceof constructor)) {
    throw new Error(`${constructor.name} "${selector}" not found.`);
  }
  return element;
}

export {};
