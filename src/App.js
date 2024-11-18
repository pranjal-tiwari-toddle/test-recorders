import AudioRecorderWithVisualizer from "./AudioVoiceRecorder";
import RMR_AudioRecorder from "./MediaRecorderAPI";
import RTCAudioRecorder from "./RecordRtc";
// import AudioRecorderComponent from "./RecorderPolyfill";

function App() {
  return (
    <div className="App">
      {/* <AudioRecorderWithVisualizer /> */}
      <RMR_AudioRecorder />
      {/* <RTCAudioRecorder /> */}
    </div>
  );
}

export default App;
