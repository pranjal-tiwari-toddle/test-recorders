import React, { useRef, useEffect, useState } from "react";
import { AudioRecorder, useAudioRecorder } from "react-audio-voice-recorder";

const AudioRecorderWithVisualizer = () => {
  const { startRecording, stopRecording, recordingBlob, isRecording } =
    useAudioRecorder();
  const recorderControls = useAudioRecorder();
  const [audioSrc, setAudioSrc] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationId = useRef(null);

  const initializeVisualizer = async () => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 1024;

    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const source = audioContextRef.current.createMediaStreamSource(
      mediaStreamRef.current
    );
    source.connect(analyserRef.current);

    drawVisualizer();
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (isPaused) return; // Stop drawing if paused
      analyserRef.current.getByteTimeDomainData(dataArray);

      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      canvasContext.lineWidth = 2;
      canvasContext.strokeStyle = "#00f";
      canvasContext.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasContext.moveTo(x, y);
        } else {
          canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasContext.lineTo(canvas.width, canvas.height / 2);
      canvasContext.stroke();

      animationId.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopVisualizer = () => {
    if (animationId.current) cancelAnimationFrame(animationId.current);
    if (analyserRef.current) analyserRef.current.disconnect();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }

    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext("2d");
    if (canvasContext)
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleStartRecording = () => {
    startRecording();
    initializeVisualizer();
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    if (isRecording) {
      // Pause the recording by suspending the audio context
      audioContextRef.current.suspend();
      setIsPaused(true);
    }
  };

  const handleResumeRecording = () => {
    if (isRecording && isPaused) {
      // Resume the recording by resuming the audio context
      audioContextRef.current.resume();
      setIsPaused(false);
      drawVisualizer(); // Resume visualizer drawing
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    stopVisualizer();
    setIsPaused(false);
  };

  useEffect(() => {
    if (recordingBlob) {
      const audioURL = URL.createObjectURL(recordingBlob);
      setAudioSrc(audioURL);
    }
    return () => stopVisualizer(); // Cleanup on unmount
  }, [recordingBlob]);

  const addAudioElement = (blob) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <AudioRecorder
        onRecordingComplete={(blob) => addAudioElement(blob)}
        recorderControls={recorderControls}
        showVisualizer={true}
      />
      {/* <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      {isRecording && !isPaused && (
        <button onClick={handlePauseRecording}>Pause</button>
      )}
      {isRecording && isPaused && (
        <button onClick={handleResumeRecording}>Resume</button>
      )}
      {audioSrc && <audio controls src={audioSrc} />}
      {audioSrc && (
        <a href={audioSrc} download="recording.wav">
          <button>Download</button>
        </a>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        style={{ border: "1px solid #ccc", marginTop: "20px" }}
      /> */}
    </div>
  );
};

export default AudioRecorderWithVisualizer;
