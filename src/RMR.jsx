import {
  register,
  MediaRecorder as ExtendableMediaRecorder,
} from "extendable-media-recorder";
import { useCallback, useEffect, useRef, useState } from "react";
import { connect } from "extendable-media-recorder-wav-encoder";

const downloadFromUrl = (url, fileName = "downloaded_file") => {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.style.display = "none";
  document.body.appendChild(link);

  try {
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading the file:", error);
  }
};

export function useReactMediaRecorder({
  audio = true,
  video = false,
  selfBrowserSurface = undefined,
  onStop = () => null,
  onStart = () => null,
  blobPropertyBag,
  screen = false,
  mediaRecorderOptions = undefined,
  customMediaStream = null,
  stopStreamsOnStop = true,
  askPermissionOnMount = false,
  blob,
  existingFile,
}) {
  const mediaRecorder = useRef(null);
  const mediaChunks = useRef([]);
  const mediaStream = useRef(null);
  const [status, setStatus] = useState("idle");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(undefined);
  const [error, setError] = useState("NONE");
  const [init, setInit] = useState(false);

  const startRecording = async () => {
    setError("NONE");
    if (!mediaStream.current) await getMediaStream();
    if (mediaStream.current) {
      const isStreamEnded = mediaStream.current
        .getTracks()
        .some((track) => track.readyState === "ended");
      if (isStreamEnded) await getMediaStream();
      if (!mediaStream.current.active) return;

      const cbrMediaRecorderOptions = {
        ...mediaRecorderOptions,
      };

      mediaRecorder.current = new ExtendableMediaRecorder(
        mediaStream.current,
        cbrMediaRecorderOptions
      );
      mediaRecorder.current.ondataavailable = onRecordingActive;
      mediaRecorder.current.onstop = onRecordingStop;
      mediaRecorder.current.onstart = onRecordingStart;
      mediaRecorder.current.onerror = () => {
        setError("NO_RECORDER");
        setStatus("idle");
      };

      mediaRecorder.current.start(1000); // Trigger data every 1 second
      setStatus("recording");
    }
  };

  // useEffect(() => {
  //   if (init) return;
  //   const setup = async () => {
  //     try {
  //       await register(await connect());
  //     } catch (e) {
  //       setError("Encoder Error");
  //     }
  //   };
  //   setup();
  //   setInit(true);
  // }, []);

  useEffect(() => {
    if (!!existingFile) {
      if (existingFile && existingFile instanceof Blob)
        mediaChunks.current.push(existingFile);
      //   const audioContext = new AudioContext();
      //   const reader = new FileReader();

      //   reader.onload = () => {
      //     const arrayBuffer = reader.result;

      //     audioContext
      //       .decodeAudioData(arrayBuffer)
      //       .then((buffer) => {
      //         const duration = buffer.duration * 1000; // Duration in milliseconds

      //         // Delay start of recording by the audio file duration + some buffer (500ms)
      //         // setTimeout(startRecording, duration + 500);
      //       })
      //       .catch((error) => {
      //         console.error("Error decoding audio data:", error);
      //       });
      //   };

      //   reader.onerror = (error) => {
      //     console.error("Error reading file:", error);
      //   };

      //   reader.readAsArrayBuffer(existingFile);
      // } else {
      //   console.error("Provided file is not a valid Blob.");
      // }
    } else if (init) return;
    else {
      const setup = async () => {
        try {
          await register(await connect());
        } catch (e) {
          setError("Encoder Error");
        }
      };
      setup();
      setInit(true);
    }
  }, [existingFile]);

  const getMediaStream = useCallback(async () => {
    setStatus("acquiring_media");
    const requiredMedia = {
      audio: typeof audio === "boolean" ? !!audio : audio,
      video: typeof video === "boolean" ? !!video : video,
    };
    try {
      if (customMediaStream) {
        mediaStream.current = customMediaStream;
      } else if (screen) {
        const stream = await window.navigator.mediaDevices.getDisplayMedia({
          video: video || true,
          selfBrowserSurface,
        });
        stream.getVideoTracks()[0].addEventListener("ended", stopRecording);
        if (audio) {
          const audioStream = await window.navigator.mediaDevices.getUserMedia({
            audio,
          });
          audioStream
            .getAudioTracks()
            .forEach((audioTrack) => stream.addTrack(audioTrack));
        }
        mediaStream.current = stream;
      } else {
        mediaStream.current = await window.navigator.mediaDevices.getUserMedia(
          requiredMedia
        );
      }
      setStatus("idle");
    } catch (error) {
      setError(error.name);
      setStatus("idle");
    }
  }, [audio, video, screen]);

  useEffect(() => {
    if (!window.MediaRecorder) throw new Error("Unsupported Browser");
    if (screen && !window.navigator.mediaDevices.getDisplayMedia) {
      throw new Error("This browser doesn't support screen capturing");
    }

    if (!mediaStream.current && askPermissionOnMount) getMediaStream();
    return () => {
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audio, screen, video, getMediaStream, askPermissionOnMount]);

  const onRecordingActive = ({ data }) => {
    if (data.size > 0) {
      mediaChunks.current.push(data);
    }
  };

  const onRecordingStart = () => {
    onStart();
  };

  const onRecordingStop = () => {
    const [chunk] = mediaChunks.current;
    const blobProperty = Object.assign(
      { type: "audio/wav" },
      blobPropertyBag || (video ? { type: "video/mp4" } : { type: "audio/wav" })
    );
    const blob = new Blob(mediaChunks.current, blobProperty);
    const url = URL.createObjectURL(blob);

    setStatus("stopped");
    setMediaBlobUrl(url);
    onStop(url, blob);
  };

  const muteAudio = (mute) => {
    setIsAudioMuted(mute);
    if (mediaStream.current) {
      mediaStream.current
        .getAudioTracks()
        .forEach((audioTrack) => (audioTrack.enabled = !mute));
    }
  };

  const pauseRecording = () => {
    const [chunk] = mediaChunks.current;
    const blobProperty = Object.assign(
      { type: "audio/wav" },
      blobPropertyBag || (video ? { type: "video/mp4" } : { type: "audio/wav" })
    );
    const blob = new Blob(mediaChunks.current, blobProperty);
    const url = URL.createObjectURL(blob);
    setMediaBlobUrl(url);
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      setStatus("paused");
      mediaRecorder.current.pause(); // Stop the recorder to save data up to this point
    }
  };

  const resumeRecording = () => {
    if (mediaStream.current) {
      setStatus("recording");
      mediaRecorder.current = new ExtendableMediaRecorder(
        mediaStream.current,
        mediaRecorderOptions || undefined
      );
      mediaRecorder.current.ondataavailable = onRecordingActive;
      mediaRecorder.current.onstop = onRecordingStop;
      mediaRecorder.current.onstart = onRecordingStart;
      mediaRecorder.current.start(1000);
    }
  };

  const stopRecording = (url) => {
    if (mediaRecorder.current) {
      if (mediaRecorder.current.state !== "inactive") {
        setStatus("stopping");
        mediaRecorder.current.stop();
        if (stopStreamsOnStop) {
          mediaStream.current?.getTracks().forEach((track) => track.stop());
        }
        mediaChunks.current = [];
      }
    }
  };

  return {
    error,
    muteAudio: () => muteAudio(true),
    unMuteAudio: () => muteAudio(false),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    mediaBlobUrl,
    status,
    isAudioMuted,
    previewStream: mediaStream.current
      ? new MediaStream(mediaStream.current.getVideoTracks())
      : null,
    previewAudioStream: mediaStream.current
      ? new MediaStream(mediaStream.current.getAudioTracks())
      : null,
    clearBlobUrl: () => {
      if (mediaBlobUrl) URL.revokeObjectURL(mediaBlobUrl);
      setMediaBlobUrl(undefined);
      setStatus("idle");
    },
  };
}

export const ReactMediaRecorder = (props) =>
  props.render(useReactMediaRecorder(props));
