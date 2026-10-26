"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { postFormWithAuth } from "@/lib/api";
import { extensionFor, MAX_RECORDING_SECONDS, pickRecordingType } from "@/lib/dictation";

export type DictationState = "idle" | "recording" | "transcribing";

/**
 * Record your voice, then turn it into text with OpenAI's speech model. toggle() starts a recording, and stops
 * it (or it stops itself after 5 minutes); the recording is then uploaded and onText gets the words.
 */
export function useDictation(onText: (text: string) => void) {
  const [state, setState] = useState<DictationState>("idle");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  // Set when the editor goes away: a recording that finishes after that is thrown away, not uploaded.
  const discard = useRef(false);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    discard.current = false;
    return () => {
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
    };
  }, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return void toast.error("This browser can't record audio.");
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = (err as DOMException).name;
      return void toast.error(
        name === "NotAllowedError"
          ? "Microphone access is blocked. Allow it in your browser's site settings."
          : name === "NotFoundError"
            ? "No microphone found."
            : "Couldn't start the microphone.",
      );
    }

    const type = pickRecordingType((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS && rec.state === "recording") rec.stop();
    }, 500);

    rec.onstop = async () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop()); // turns the microphone light off
      recorder.current = null;
      if (discard.current) return;

      const mime = rec.mimeType || type || "audio/webm";
      const audio = new Blob(chunks, { type: mime });
      if (Date.now() - startedAt < 700 || audio.size < 1500) {
        setState("idle");
        return void toast.warning("Didn't catch anything. Record a little longer and speak clearly.");
      }
      setState("transcribing");
      try {
        const form = new FormData();
        form.append("audio", audio, `note.${extensionFor(mime)}`);
        const { text } = await postFormWithAuth<{ text: string }>("/api/speech-to-text", form);
        if (discard.current) return;
        if (text.trim()) onTextRef.current(text);
        else toast.warning("Didn't catch any words. Try again.");
      } catch (err) {
        console.error("[speech-to-text]", err);
        toast.error((err as Error).message);
      } finally {
        if (!discard.current) setState("idle");
      }
    };

    recorder.current = rec;
    rec.start();
    setSeconds(0);
    setState("recording");
  }

  function toggle() {
    if (state === "recording") recorder.current?.stop();
    else if (state === "idle") void start();
  }

  return { state, seconds, toggle };
}
