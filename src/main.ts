declare global {
  var webkitAudioContext: typeof window.AudioContext;
}

let AudioContext = window.AudioContext || window.webkitAudioContext;
let audioData: ArrayBuffer;
let audioCtx: AudioContext;
let audioSource: AudioBufferSourceNode;
let fileInput = q(HTMLInputElement, "#file-input");
let fileReader = new FileReader();

fileInput.addEventListener("click", () => {
  audioCtx = audioCtx ?? new AudioContext();
  if (audioSource) audioSource.stop();
  audioSource = audioCtx.createBufferSource();
});

fileInput.addEventListener("change", () => {
  let file = fileInput.files?.[0];
  if (!file) return;
  fileInput.disabled = true;
  fileReader.readAsArrayBuffer(file);
});

fileReader.addEventListener("load", e => {
  audioData = fileReader.result as ArrayBuffer;
  audioCtx.decodeAudioData(
    audioData,
    decodeSuccessCallback,
    decodeErrorCallback
  );
});

fileReader.addEventListener("error", () => {
  console.error("Could not read file:", fileReader.error!);
});

function decodeSuccessCallback(buffer: AudioBuffer) {
  audioSource.buffer = buffer;
  audioSource.connect(audioCtx.destination);
  audioSource.start();
  fileInput.disabled = false;
}

function decodeErrorCallback(error: any) {
  console.error("Could not decode audio:", error);
  fileInput.disabled = false;
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
