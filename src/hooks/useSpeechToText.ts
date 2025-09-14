/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from "react";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

interface UseSpeechToTextReturn {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      console.log("Starting voice recording...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log("Microphone access granted");

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("Audio data received:", event.data.size, "bytes");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        console.log("No active recording to stop");
        resolve(null);
        return;
      }

      console.log("Stopping recording...");
      mediaRecorderRef.current.onstop = async () => {
        try {
          setIsProcessing(true);
          console.log("Processing audio...");

          // Create audio blob from recorded chunks
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          console.log("Audio blob created:", audioBlob.size, "bytes");

          // Check if API key exists
          const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
          if (!apiKey) {
            console.error("ElevenLabs API key not found");
            setError("ElevenLabs API key not configured");
            resolve(null);
            return;
          }

          // Initialize ElevenLabs client
          const elevenlabs = new ElevenLabsClient({
            apiKey: apiKey,
          });

          // Convert speech to text using ElevenLabs SDK - fix the API call structure
          const transcription = await elevenlabs.speechToText.convert({
            file: audioBlob, // Pass the blob directly as file
            modelId: "scribe_v1",
            languageCode: "eng",
            tagAudioEvents: false,
            diarize: false,
          });

          console.log("Transcription result:", transcription);

          // Extract text from transcription result - handle different possible response structures
          let transcribedText = "";
          if (typeof transcription === "string") {
            transcribedText = transcription;
          } else if (transcription && typeof transcription === "object") {
            // Try different possible property names based on the API response
            transcribedText =
              (transcription as any).text ||
              (transcription as any).transcript ||
              (transcription as any).transcription ||
              "";
          }

          resolve(transcribedText);
        } catch (err) {
          console.error("Error processing speech to text:", err);
          setError("Failed to process speech to text. Please try again.");
          resolve(null);
        } finally {
          setIsProcessing(false);
          setIsRecording(false);

          // Clean up media stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
  };
};
