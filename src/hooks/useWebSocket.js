"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = "ws://localhost:3030";

export default function useWebSocket(userId) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const listeners = useRef([]);

  const onMessage = useCallback((fn) => {
    listeners.current.push(fn);
    return () => {
      listeners.current = listeners.current.filter((l) => l !== fn);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
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
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = () => {};

    return () => {
      socket.close();
    };
  }, [userId]);

  const sendMessage = useCallback((to, text) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "message", to, text }));
    }
  }, []);

  return { connected, messages, onlineUsers, sendMessage, onMessage };
}
