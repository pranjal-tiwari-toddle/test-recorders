import React, { useEffect, useRef, useState } from "react";
import _ from "lodash";
const ScrollingAudioVisualizer = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationIdRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;

    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024; // Set for better resolution
        analyser.smoothingTimeConstant = 0.85;
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        drawVisualizer();
        interval = setInterval(() => {
          setRecordingTime((prevTime) => prevTime + 1);
        }, 1000);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    setupAudio();

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationIdRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const barWidth = 30; // Width of each bar
    const barSpacing = 100; // Space between bars
    const scrollSpeed = 1; // Speed of scrolling

    let xOffset = 0;

    const draw = () => {
      animationIdRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Shift existing content to the left
      canvasCtx.clearRect(0, 0, scrollSpeed, HEIGHT);
      canvasCtx.drawImage(
        canvas,
        scrollSpeed,
        0,
        WIDTH - scrollSpeed,
        HEIGHT,
        0,
        0,
        WIDTH - scrollSpeed,
        HEIGHT
      );

      // Clear the right edge and draw new data
      canvasCtx.clearRect(WIDTH - scrollSpeed, 0, scrollSpeed, HEIGHT);
      canvasCtx.fillStyle = "#111";
      canvasCtx.fillRect(WIDTH - scrollSpeed, 0, scrollSpeed, HEIGHT);

      // Draw new bars
      const totalBars = Math.floor(WIDTH / (barWidth + barSpacing));

      for (let i = 0; i < totalBars; i++) {
        const dataIndex =
          (i + Math.floor(xOffset / (barWidth + barSpacing))) %
          dataArray.length;
        const barHeight = dataArray[dataIndex] / 2;

        const x = WIDTH - i * (barWidth + barSpacing) - barWidth;
        const y = HEIGHT / 2 - barHeight / 2;

        // Draw the bar (vertical line for amplitude)
        canvasCtx.fillStyle = "#fff"; // Color for the bar
        canvasCtx.fillRect(x, y, barWidth, barHeight);
      }

      xOffset -= scrollSpeed;
      if (xOffset <= -barWidth) {
        xOffset = 0;
      }
    };

    draw();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#111",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <div style={{ flex: "1" }}>
        <canvas
          ref={canvasRef}
          width="500"
          height="100"
          style={{ background: "#111" }}
        />
      </div>
      <div style={{ color: "#fff", fontSize: "18px", paddingLeft: "10px" }}>
        {formatTime(recordingTime)}
      </div>
    </div>
  );
};

export default ScrollingAudioVisualizer;
