import React, { useState, useRef } from "react";
import AudioRecorder from "audio-recorder-polyfill";

const AudioRecorderComponent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const audioRef = useRef(null);
  const recorder = useRef(null);

  // Start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new AudioRecorder(stream);
    recorder.current.ondataavailable = (event) => {
      setAudioBlob(event.data);
      const audioURL = URL.createObjectURL(event.data);
      setAudioUrl(audioURL);
    };
    recorder.current.start();
    setIsRecording(true);
  };

  // Stop recording
  const stopRecording = () => {
    recorder.current?.stop();
    setIsRecording(false);
  };

  // Play recorded audio
  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Pause the playback
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Download the recorded audio
  const downloadAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "recorded-audio.wav"; // or any format you want
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <h2>Audio Recorder</h2>
      <div>
        {isRecording ? (
          <button onClick={stopRecording}>Stop Recording</button>
        ) : (
          <button onClick={startRecording}>Start Recording</button>
        )}
        {audioUrl && !isPlaying && <button onClick={playAudio}>Play</button>}
        {isPlaying && <button onClick={pauseAudio}>Pause</button>}
        {audioUrl && <button onClick={downloadAudio}>Download</button>}
      </div>
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}
    </div>
  );
};

export default AudioRecorderComponent;
