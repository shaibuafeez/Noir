"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { NOIR_VOICE_TOOLS, NOIR_SYSTEM_INSTRUCTION } from "./gemini-tools";
import type { Session } from "@google/genai";

export type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking";

interface UseVoiceSessionOpts {
  sendVoiceAction: (action: string, params: Record<string, unknown>) => void;
}

export function useVoiceSession({ sendVoiceAction }: UseVoiceSessionOpts) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const sessionRef = useRef<Session | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const pendingAudioRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Drain queued audio chunks through playback context
  const drainAudio = useCallback(() => {
    if (isPlayingRef.current) return;
    const chunks = pendingAudioRef.current;
    if (chunks.length === 0) return;
    isPlayingRef.current = true;
    const ctx = playbackCtxRef.current;
    if (!ctx) { isPlayingRef.current = false; return; }

    // Merge all pending chunks
    const total = chunks.reduce((s, c) => s + c.length, 0);
    const merged = new Float32Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    pendingAudioRef.current = [];

    const buf = ctx.createBuffer(1, merged.length, 24000);
    buf.getChannelData(0).set(merged);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => {
      isPlayingRef.current = false;
      // Check for more audio that arrived while playing
      if (pendingAudioRef.current.length > 0) drainAudio();
      else setState((s) => s === "speaking" ? "listening" : s);
    };
    src.start();
    setState("speaking");
  }, []);

  const connect = useCallback(async () => {
    if (sessionRef.current) return;
    setState("connecting");

    try {
      // Fetch config from backend
      const configResp = await fetch("/api/gemini/config");
      if (!configResp.ok) throw new Error("Gemini not configured on server");
      const { apiKey, voiceModel } = await configResp.json();

      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: voiceModel,
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: NOIR_VOICE_TOOLS }],
          systemInstruction: { parts: [{ text: NOIR_SYSTEM_INSTRUCTION }] },
        },
        callbacks: {
          onopen: () => {
            setState("listening");
          },
          onmessage: (message: any) => {
            const content = message.serverContent;
            if (content) {
              // Audio data from model
              if (content.modelTurn?.parts) {
                for (const part of content.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    const raw = atob(part.inlineData.data);
                    const bytes = new Uint8Array(raw.length);
                    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                    // Convert PCM16 LE to Float32
                    const samples = new Float32Array(bytes.length / 2);
                    const view = new DataView(bytes.buffer);
                    for (let i = 0; i < samples.length; i++) {
                      samples[i] = view.getInt16(i * 2, true) / 32768;
                    }
                    pendingAudioRef.current.push(samples);
                    drainAudio();
                  }
                }
              }
              // Transcriptions
              if (content.outputTranscription?.text) {
                setTranscript(content.outputTranscription.text);
              }
              if (content.interrupted) {
                // Stop all pending audio
                pendingAudioRef.current = [];
                isPlayingRef.current = false;
                setState("listening");
              }
            }

            // Function calling
            const turn = message.toolCall;
            if (turn?.functionCalls) {
              setState("thinking");
              const functionResponses: Array<{ id: string; name: string; response: { result: string } }> = [];
              for (const fc of turn.functionCalls) {
                // Send action to backend via WS
                sendVoiceAction(fc.name, fc.args ?? {});
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: "pending" },
                });
              }
              // We'll send the real response when the backend replies
              // Store function call IDs for later
              pendingFnRef.current = functionResponses;
            }
          },
          onerror: (e: any) => {
            console.error("[voice] Gemini error:", e);
          },
          onclose: () => {
            setState("idle");
            sessionRef.current = null;
          },
        },
      });

      sessionRef.current = session;

      // Start microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !sessionRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        // Convert Float32 to PCM16 LE bytes
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(input[i]! * 32767)));
        }
        const bytes = new Uint8Array(pcm16.buffer);
        // Base64 encode
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
        const b64 = btoa(binary);
        session.sendRealtimeInput({
          audio: { data: b64, mimeType: "audio/pcm;rate=16000" },
        });
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Playback context at 24kHz (Gemini output sample rate)
      playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });

    } catch (err) {
      console.error("[voice] Connect failed:", err);
      setState("idle");
    }
  }, [isMuted, sendVoiceAction, drainAudio]);

  const pendingFnRef = useRef<Array<{ id: string; name: string; response: { result: string } }>>([]);

  // Call this when WS sends back the voice_response with the action result
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
      session.sendToolResponse({ functionResponses });
      pendingFnRef.current = [];
    }
    setState("listening");
  }, []);

  const disconnect = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    playbackCtxRef.current?.close();
    sessionRef.current?.close();
    sessionRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    playbackCtxRef.current = null;
    pendingAudioRef.current = [];
    pendingFnRef.current = [];
    isPlayingRef.current = false;
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
