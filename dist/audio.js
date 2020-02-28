import { q } from "./domUtils.js";
export function initialize() {
    return new Promise(resolve => {
        let initAudioButton = q("#init-audio-button");
        let listener = async () => {
            initAudioButton.removeEventListener("click", listener);
            initAudioButton.disabled = true;
            let { mediaDevices } = navigator;
            let inputStream = await mediaDevices.getUserMedia({ audio: true });
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let audioSource = audioCtx.createMediaStreamSource(inputStream);
            let analyser = audioCtx.createAnalyser();
            let frequencyData = new Uint8Array(analyser.frequencyBinCount);
            audioSource.connect(analyser);
            resolve({
                getFrequencyData() {
                    analyser.getByteFrequencyData(frequencyData);
                    return frequencyData;
                }
            });
        };
        initAudioButton.addEventListener("click", listener);
        initAudioButton.disabled = false;
    });
}
