"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3030";
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

export default function useWebSocket(userId) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const listeners = useRef([]);
  const reconnectTimeout = useRef(null);
  const reconnectAttempt = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!userId || !mountedRef.current) return;

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      reconnectAttempt.current = 0;
      socket.send(JSON.stringify({ type: "auth", id: userId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "auth_ok") {
        setConnected(true);
        return;
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
        listeners.current.forEach((fn) => fn(data));
        return;
      }

      if (data.type === "user_list") {
        setOnlineUsers(data.users);
        return;
      }

      if (data.type === "typing") {
        setTypingUsers((prev) => ({
          ...prev,
          [data.from]: data.typing,
        }));
        return;
      }
    };

    socket.onclose = () => {
      setConnected(false);
      if (mountedRef.current) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempt.current),
          MAX_RECONNECT_DELAY
        );
        reconnectAttempt.current += 1;
        reconnectTimeout.current = setTimeout(connect, delay);
      }
    };

    socket.onerror = () => {};
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((to, text) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "message", to, text }));
    }
  }, []);

  const sendTyping = useCallback((to, typing) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "typing", to, typing }));
    }
  }, []);

  const onMessage = useCallback((fn) => {
    listeners.current.push(fn);
    return () => {
      listeners.current = listeners.current.filter((l) => l !== fn);
    };
  }, []);

  return { connected, messages, onlineUsers, typingUsers, sendMessage, sendTyping, onMessage };
}
