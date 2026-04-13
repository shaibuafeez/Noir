"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { NOIR_VOICE_TOOLS, NOIR_SYSTEM_INSTRUCTION } from "./gemini-tools";
import type { Session } from "@google/genai";

function apiBase(): string {
  if (typeof window === "undefined") return "";
  if (window.location.port === "3002") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return "";
}

// ── Audio helpers ──

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function decodeBase64(b64: string): Uint8Array {
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function createPcmBlob(floatData: Float32Array): { data: string; mimeType: string } {
  const pcm16 = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    pcm16[i] = floatData[i]! * 32768;
  }
  return {
    data: encodeBase64(new Uint8Array(pcm16.buffer)),
    mimeType: "audio/pcm;rate=16000",
  };
}

function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
): AudioBuffer {
  const int16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, int16.length, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) {
    channel[i] = int16[i]! / 32768.0;
  }
  return buffer;
}

// ── Types ──

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

interface UseVoiceSessionOpts {
  sendVoiceAction: (action: string, params: Record<string, unknown>) => void;
}

export function useVoiceSession({ sendVoiceAction }: UseVoiceSessionOpts) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const sessionPromiseRef = useRef<Promise<Session> | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const pendingFnRef = useRef<Array<{ id: string; name: string; response: { result: string } }>>([]);
  const inputTranscriptRef = useRef("");
  const outputTranscriptRef = useRef("");

  const connect = useCallback(async () => {
    if (sessionRef.current || sessionPromiseRef.current) return;
    setState("connecting");

    try {
      // Fetch config from backend
      const configResp = await fetch(`${apiBase()}/api/gemini/config`);
      if (!configResp.ok) throw new Error("Gemini not configured on server");
      const configBody = await configResp.json();
      const { apiKey } = configBody.data ?? configBody;

      const ai = new GoogleGenAI({ apiKey });

      // Playback context at 24kHz (Gemini output sample rate)
      playbackCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Kore",
              },
            },
          },
          tools: [{ functionDeclarations: NOIR_VOICE_TOOLS }],
          systemInstruction: { parts: [{ text: NOIR_SYSTEM_INSTRUCTION }] },
        },
        callbacks: {
          onopen: () => {
            console.log("[voice] Session opened");
            setState("listening");
          },
          onmessage: (message: any) => {
            const content = message.serverContent;
            if (content) {
              // Audio data from model
              const audioData = content.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && playbackCtxRef.current) {
                setState("speaking");
                const decoded = decodeBase64(audioData);
                const audioBuffer = decodeAudioData(decoded, playbackCtxRef.current, 24000);
                const src = playbackCtxRef.current.createBufferSource();
                src.buffer = audioBuffer;
                src.connect(playbackCtxRef.current.destination);

                const currentTime = playbackCtxRef.current.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);
                src.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;

                src.onended = () => {
                  if (playbackCtxRef.current && nextStartTimeRef.current <= playbackCtxRef.current.currentTime) {
                    setState((s) => (s === "speaking" ? "listening" : s));
                  }
                };
              }

              // Accumulate transcriptions
              if (content.inputTranscription?.text) {
                inputTranscriptRef.current += content.inputTranscription.text;
              }
              if (content.outputTranscription?.text) {
                outputTranscriptRef.current += content.outputTranscription.text;
                setTranscript(outputTranscriptRef.current);
              }

              // Turn complete — finalize transcripts
              if (content.turnComplete) {
                inputTranscriptRef.current = "";
                outputTranscriptRef.current = "";
                setState("listening");
              }

              if (content.interrupted) {
                nextStartTimeRef.current = 0;
                setState("listening");
              }
            }

            // Function calling
            if (message.toolCall?.functionCalls) {
              setState("thinking");
              const functionResponses: Array<{ id: string; name: string; response: { result: string } }> = [];
              for (const fc of message.toolCall.functionCalls) {
                console.log("[voice] Function call:", fc.name, fc.args);
                sendVoiceAction(fc.name, fc.args ?? {});
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: "pending" },
                });
              }
              pendingFnRef.current = functionResponses;
            }
          },
          onerror: (e: any) => {
            console.error("[voice] Gemini error:", e);
            setState("idle");
          },
          onclose: () => {
            console.log("[voice] Session closed");
            setState("idle");
            sessionRef.current = null;
            sessionPromiseRef.current = null;
          },
        },
      });

      sessionPromiseRef.current = sessionPromise;
      const session = await sessionPromise;
      sessionRef.current = session;

      // Start microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioCtxRef.current = inputCtx;
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(input);
        session.sendRealtimeInput({ media: pcmBlob as any });
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      setState("listening");
    } catch (err) {
      console.error("[voice] Connect failed:", err);
      setState("idle");
      sessionRef.current = null;
      sessionPromiseRef.current = null;
    }
  }, [isMuted, sendVoiceAction]);

  // Called when WS sends back the voice_response with the action result
  const handleActionResult = useCallback((message: string) => {
    const session = sessionRef.current;
    if (!session) return;
    const pending = pendingFnRef.current;
    if (pending.length > 0) {
      const functionResponses = pending.map((fn) => ({
        id: fn.id,
        name: fn.name,
        response: { result: message },
      }));
      session.sendToolResponse({ functionResponses } as any);
      pendingFnRef.current = [];
    }
    setState("listening");
  }, []);

  const disconnect = useCallback(() => {
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    playbackCtxRef.current?.close();
    sessionRef.current?.close();
    sessionRef.current = null;
    sessionPromiseRef.current = null;
    processorRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    playbackCtxRef.current = null;
    nextStartTimeRef.current = 0;
    pendingFnRef.current = [];
    setState("idle");
    setTranscript("");
  }, []);

  const toggleMic = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  return {
    state,
    transcript,
    connect,
    disconnect,
    toggleMic,
    isMuted,
    handleActionResult,
  };
}
