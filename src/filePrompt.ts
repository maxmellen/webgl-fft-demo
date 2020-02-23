import { $$$ } from "./domUtils.js";

let fileDropContainer = $$$(HTMLDivElement, "file-drop-container");
let fileInput = $$$(HTMLInputElement, "file-input");
let fileReader = new FileReader();

let onFileReaderLoad: ((data: ArrayBuffer) => void) | undefined;
let onFileReaderError: ((reason: any) => void) | undefined;

let fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
  onFileReaderLoad = resolve;
  onFileReaderError = reject;
});

fileDropContainer.addEventListener("click", () => {
  fileInput.click();
});

fileDropContainer.addEventListener("drop", e => {
  e.preventDefault();
  let file = e.dataTransfer?.files?.[0];
  if (!file) return;
  handleFile(file);
});

fileDropContainer.addEventListener("dragover", e => {
  e.preventDefault();
});

fileInput.addEventListener("change", () => {
  let [file] = fileInput.files!;
  handleFile(file);
});

fileReader.addEventListener("load", () => {
  onFileReaderLoad!(fileReader.result as ArrayBuffer);
});

fileReader.addEventListener("error", () => {
  onFileReaderError!(
    new Error(
      `File reader failed to read file contents:\n\n${fileReader.error}`
    )
  );
});

function handleFile(file: File) {
  hideContainer();
  fileReader.readAsArrayBuffer(file);
}

function hideContainer(): void {
  fileDropContainer.style.display = "none";
}

export async function waitForFileData(): Promise<ArrayBuffer> {
  return fileDataPromise;
}
