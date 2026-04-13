"use client";

import * as React from "react";
import type { AuthSession } from "./auth";
import {
  parseAuthFromUrl,
  loadAuthSession,
  saveAuthSession,
  clearAuthSession,
} from "./auth";

export type WsMessage =
  | { type: "wallet"; address: string; sessionId: string; auth?: boolean }
  | { type: "response"; message: string }
  | { type: "confirm"; message: string; key: string }
  | { type: "error"; message: string }
  | { type: "voice_response"; message: string; confirmKey?: string };

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  confirmKey?: string;
  ts: number;
}

type VoiceResponseCallback = (message: string, confirmKey?: string) => void;

interface WsContextValue {
  connected: boolean;
  walletAddress: string | null;
  sessionId: string | null;
  authSession: AuthSession | null;
  messages: ChatMessage[];
  send: (text: string) => void;
  confirm: (key: string) => void;
  cancel: (key: string) => void;
  clearMessages: () => void;
  signOut: () => void;
  sendVoiceAction: (action: string, params: Record<string, unknown>) => void;
  onVoiceResponse: (cb: VoiceResponseCallback | null) => void;
}

const WsContext = React.createContext<WsContextValue | null>(null);

function getWsUrl(): string {
  if (typeof window === "undefined") return "";
  // In dev (Next dev server on 3002), point at backend on 3000.
  // In prod (backend serves the export), use same host.
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host =
    window.location.port === "3002"
      ? `${window.location.hostname}:3000`
      : window.location.host;
  return `${proto}//${host}`;
}

export function WsProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [authSession, setAuthSession] = React.useState<AuthSession | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const wsRef = React.useRef<WebSocket | null>(null);
  const voiceCallbackRef = React.useRef<VoiceResponseCallback | null>(null);

  // Check for auth on mount: URL param → localStorage → fallback to ephemeral
  const resolveAuth = React.useCallback((): AuthSession | null => {
    const fromUrl = parseAuthFromUrl();
    if (fromUrl) {
      saveAuthSession(fromUrl);
      // Clean the URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
      return fromUrl;
    }
    return loadAuthSession();
  }, []);

  const connect = React.useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        const auth = resolveAuth();
        if (auth) {
          setAuthSession(auth);
          ws.send(JSON.stringify({ type: "auth", sessionId: auth.sessionId }));
        } else {
          ws.send(JSON.stringify({ type: "start" }));
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Reconnect after 2s
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // onclose will handle reconnect
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as WsMessage;

          if (data.type === "wallet") {
            setWalletAddress(data.address);
            setSessionId(data.sessionId);
            return;
          }

          if (data.type === "response") {
            setMessages((m) => [
              ...m,
              {
                id: `${Date.now()}-${Math.random()}`,
                sender: "bot",
                text: data.message,
                ts: Date.now(),
              },
            ]);
            return;
          }

          if (data.type === "confirm") {
            setMessages((m) => [
              ...m,
              {
                id: `${Date.now()}-${Math.random()}`,
                sender: "bot",
                text: data.message,
                confirmKey: data.key,
                ts: Date.now(),
              },
            ]);
            return;
          }

          if (data.type === "voice_response") {
            // Route to voice callback if registered, else show as chat
            if (voiceCallbackRef.current) {
              voiceCallbackRef.current(data.message, data.confirmKey);
            } else {
              setMessages((m) => [
                ...m,
                {
                  id: `${Date.now()}-${Math.random()}`,
                  sender: "bot",
                  text: data.message,
                  confirmKey: data.confirmKey,
                  ts: Date.now(),
                },
              ]);
            }
            return;
          }

          if (data.type === "error") {
            setMessages((m) => [
              ...m,
              {
                id: `${Date.now()}-${Math.random()}`,
                sender: "bot",
                text: `Error: ${data.message}`,
                ts: Date.now(),
              },
            ]);
          }
        } catch {
          // Ignore malformed messages
        }
      };
    } catch {
      setConnected(false);
      setTimeout(connect, 2000);
    }
  }, [resolveAuth]);

  React.useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const send = React.useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setMessages((m) => [
      ...m,
      {
        id: `${Date.now()}-${Math.random()}`,
        sender: "user",
        text,
        ts: Date.now(),
      },
    ]);
    wsRef.current.send(JSON.stringify({ type: "message", text }));
  }, []);

  const confirm = React.useCallback((key: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "confirm", key }));
    // Clear confirmKey from that message
    setMessages((m) =>
      m.map((x) => (x.confirmKey === key ? { ...x, confirmKey: undefined } : x))
    );
  }, []);

  const cancel = React.useCallback((key: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "cancel", key }));
    setMessages((m) =>
      m.map((x) => (x.confirmKey === key ? { ...x, confirmKey: undefined } : x))
    );
  }, []);

  const clearMessages = React.useCallback(() => setMessages([]), []);

  const signOut = React.useCallback(() => {
    clearAuthSession();
    setAuthSession(null);
    // Reconnect with ephemeral session
    wsRef.current?.close();
  }, []);

  const sendVoiceAction = React.useCallback(
    (action: string, params: Record<string, unknown>) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify({ type: "voice_action", action, params }));
    },
    []
  );

  const onVoiceResponse = React.useCallback(
    (cb: VoiceResponseCallback | null) => {
      voiceCallbackRef.current = cb;
    },
    []
  );

  const value = React.useMemo<WsContextValue>(
    () => ({
      connected,
      walletAddress,
      sessionId,
      authSession,
      messages,
      send,
      confirm,
      cancel,
      clearMessages,
      signOut,
      sendVoiceAction,
      onVoiceResponse,
    }),
    [
      connected,
      walletAddress,
      sessionId,
      authSession,
      messages,
      send,
      confirm,
      cancel,
      clearMessages,
      signOut,
      sendVoiceAction,
      onVoiceResponse,
    ]
  );

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>;
}

export function useWs(): WsContextValue {
  const ctx = React.useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used within WsProvider");
  return ctx;
}
