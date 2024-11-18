import React from "react";
import { useReactMediaRecorder } from "./RMR";
import audiotest from "./audiotest.wav";

let fileBlob;
try {
  // Fetch the audio file as a Blob
  fetch(audiotest)
    .then((response) => response.blob())
    .then((blob) => {
      // Now the fileBlob will contain the Blob representing the audio file
      fileBlob = blob;
      console.log("Audio Blob:", fileBlob);
    })
    .catch((error) => {
      console.log("Error fetching the audio file:", error);
    });
} catch (error) {
  console.log("Error creating blob file: ", error);
}

const RMR_AudioRecorder = () => {
  const onStop = (url, blob) => {
    console.log("onstop recording callbavk", url, blob);
  };

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    pauseRecording,
    resumeRecording,
    blob,
  } = useReactMediaRecorder({
    audio: true,
    // existingFile: fileBlob,
    onStop,
  });
  return (
    <div>
      <h2>Audio Recorder</h2>
      <p>Status: {status}</p>

      <div>
        <button onClick={startRecording}>Start Recording</button>
        <button
          onClick={(e) => {
            pauseRecording(e);
          }}
          disabled={status !== "recording"}
        >
          Pause
        </button>
        <button onClick={resumeRecording} disabled={status !== "paused"}>
          Resume
        </button>
        <button onClick={stopRecording}>Stop Recording</button>
      </div>

      {mediaBlobUrl && (
        <div>
          <h3>Recorded Audio:</h3>
          <audio src={mediaBlobUrl} controls />
        </div>
      )}
    </div>
  );
};

export default RMR_AudioRecorder;
