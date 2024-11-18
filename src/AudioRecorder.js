import { useEffect, useRef } from "react";
import { useVoiceVisualizer, VoiceVisualizer } from "react-voice-visualizer";

const AudioRecorderWithVisualizer = () => {
  // Initialize the recorder controls using the hook
  const recorderControls = useVoiceVisualizer();
  const audioRef = useRef(null);
  const {
    // ... (Extracted controls and states, if necessary)
    recordedBlob,
    error,
  } = recorderControls;

  // Get the recorded audio blob
  useEffect(() => {
    if (!recordedBlob) return;

    console.log(recordedBlob);
  }, [recordedBlob, error]);

  // Get the error when it occurs
  useEffect(() => {
    if (!error) return;

    console.error(error);
  }, [error]);

  return (
    <div style={{ background: "red" }}>
      <div ref={audioRef}></div>
      <VoiceVisualizer
        controls={recorderControls}
        animateCurrentPick={true}
        isDefaultUIShown={true}
        isDownloadAudioButtonShown={true}
        showVisualizer={true}
      />
    </div>
  );
};

export default AudioRecorderWithVisualizer;
