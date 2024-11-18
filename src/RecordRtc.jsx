import React, { useState, useRef, useEffect } from "react";
import RecordRTC from "recordrtc";

const AudioRecorder = () => {
  const [recorder, setRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [downloadURL, setDownloadURL] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const audioStreamRef = useRef(null);
  const animationIdRef = useRef(null);

  // Start recording
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;
    const newRecorder = new RecordRTC(stream, { type: "audio" });
    newRecorder.startRecording();

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    source.connect(analyserRef.current);

    setRecorder(newRecorder);
    setIsRecording(true);
    setIsPaused(false);
    visualize();
  };

  // Pause recording
  const pauseRecording = () => {
    if (recorder) {
      recorder.pauseRecording();
      setIsPaused(true);
      cancelAnimationFrame(animationIdRef.current); // Stop visualization
    }
  };
  console.log(recorder);
  // Resume recording
  const resumeRecording = () => {
    if (recorder) {
      recorder.resumeRecording();
      setIsPaused(false);
      visualize(); // Restart visualization
    }
  };

  useEffect(() => {
    if (isPaused) {
      console.log(recorder);
      console.log(recorder.getBlob(), recorder.getState());
    }
  }, [isPaused]);

  // Stop recording
  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        setAudioBlob(blob);
        setDownloadURL(URL.createObjectURL(blob));
        setAudioURL(URL.createObjectURL(blob));
      });
      setIsRecording(false);
      setIsPaused(false);

      // Clean up audio context and animation
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioContextRef.current.close();
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  // Visualize the audio waveform
  const visualize = () => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Clear and draw waveform
      canvasCtx.fillStyle = "#fff";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "#4CAF50";

      canvasCtx.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();

      // Recursively call draw
      animationIdRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Download the recorded audio
  const downloadAudio = () => {
    if (audioBlob) {
      const link = document.createElement("a");
      link.href = downloadURL;
      link.setAttribute("download", "audio_recording.wav");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h3>Audio Recorder with Visualizer</h3>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        style={{ border: "1px solid #ccc", margin: "20px 0" }}
      />
      <div>
        {!isRecording && (
          <button onClick={startRecording}>Start Recording</button>
        )}
        {isRecording && !isPaused && (
          <button onClick={pauseRecording}>Pause</button>
        )}
        {isRecording && isPaused && (
          <button onClick={resumeRecording}>Resume</button>
        )}
        {isRecording && <button onClick={stopRecording}>Stop</button>}
      </div>
      <div>
        {audioBlob && (
          <>
            <audio controls src={audioURL} />
            <button onClick={downloadAudio}>Download</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
