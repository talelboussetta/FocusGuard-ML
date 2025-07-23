// hooks/useCollector.js
import { useEffect, useRef } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";
import axios from "axios";

const API_BASE = "http://192.168.1.34:5000"; // Replace with your actual LAN IP

export function useCollector(started, videoRef) {
  const blinkRef = useRef(0);

  const postLog = async (type, detail = "") => {
    try {
      await axios.post(`${API_BASE}/log`, {
        event_type: type,
        detail,
      });
    } catch (err) {
      console.error("Log error", err);
    }
  };

  useEffect(() => {
    if (!started) return;

    const handleKey = (e) => postLog("keyboard_press", e.key);
    const handleMouse = (e) =>
      postLog("mouse_click", `at (${e.clientX}, ${e.clientY})`);

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleMouse);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleMouse);
    };
  }, [started]);

  useEffect(() => {
    if (!started || !videoRef.current) return;

    let intervalId;
    let model;
    const EAR_THRESHOLD = 0.22;
    let closedCounter = 0;
    let lastBlinkTime = 0;
    const LEFT_EYE = [33, 160, 158, 133, 153, 144];

    const getEAR = (landmarks) => {
      const d = (i, j) => {
        const a = landmarks[i],
          b = landmarks[j];
        return Math.hypot(a.x - b.x, a.y - b.y);
      };
      const v1 = d(1, 5);
      const v2 = d(2, 4);
      const h = d(0, 3);
      return (v1 + v2) / (2.0 * h);
    };

    const startDetection = async () => {
      // Debug: check supported packages
      console.log("SupportedPackages:", faceLandmarksDetection.SupportedPackages);

      // Use the exact key that exists in your version
      const packageKey =
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh ||
        faceLandmarksDetection.SupportedPackages.mediapipeFaceMesh;

      if (!packageKey) {
        console.error(
          "SupportedPackages does not have mediapipeFacemesh or mediapipeFaceMesh key!"
        );
        return;
      }

      model = await faceLandmarksDetection.load(packageKey);

      intervalId = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState !== 4) return;

        const faces = await model.estimateFaces({ input: video });
        if (faces.length === 0) return;

        const keypoints = faces[0].scaledMesh;
        const landmarks = LEFT_EYE.map((i) => ({
          x: keypoints[i][0],
          y: keypoints[i][1],
        }));

        const ear = getEAR(landmarks);
        const now = Date.now();

        if (ear < EAR_THRESHOLD) {
          closedCounter++;
        } else {
          if (closedCounter >= 3 && now - lastBlinkTime > 1000) {
            blinkRef.current++;
            postLog("blink", `total_blinks=${blinkRef.current}`);
            lastBlinkTime = now;
          }
          closedCounter = 0;
        }
      }, 100);
    };

    startDetection();

    return () => clearInterval(intervalId);
  }, [started, videoRef]);
}
