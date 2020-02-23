import { $$$ } from "./domUtils.js";
let fileDropContainer = $$$(HTMLDivElement, "file-drop-container");
let fileInput = $$$(HTMLInputElement, "file-input");
let fileReader = new FileReader();
let onFileReaderLoad;
let onFileReaderError;
let fileDataPromise = new Promise((resolve, reject) => {
    onFileReaderLoad = resolve;
    onFileReaderError = reject;
});
fileDropContainer.addEventListener("click", () => {
    fileInput.click();
});
fileDropContainer.addEventListener("drop", e => {
    var _a, _b;
    e.preventDefault();
    let file = (_b = (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b[0];
    if (!file)
        return;
    handleFile(file);
});
fileDropContainer.addEventListener("dragover", e => {
    e.preventDefault();
});
fileInput.addEventListener("change", () => {
    let [file] = fileInput.files;
    handleFile(file);
});
fileReader.addEventListener("load", () => {
    onFileReaderLoad(fileReader.result);
});
fileReader.addEventListener("error", () => {
    onFileReaderError(new Error(`File reader failed to read file contents:\n\n${fileReader.error}`));
});
function handleFile(file) {
    hideContainer();
    fileReader.readAsArrayBuffer(file);
}
function hideContainer() {
    fileDropContainer.style.display = "none";
}
export async function waitForFileData() {
    return fileDataPromise;
}
