"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3030";
const MAX_RECONNECT_DELAY = 30000;
const INITIAL_RECONNECT_DELAY = 1000;

export default function useWebSocket(userId, userName) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [lastContactAdded, setLastContactAdded] = useState(null);
  const [contactAddedCount, setContactAddedCount] = useState(0);
  const listeners = useRef([]);
  const reconnectTimeout = useRef(null);
  const reconnectAttempt = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!userId || !mountedRef.current) return;

    if (ws.current) {
      ws.current.onclose = null;
      ws.current.close();
    }

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      reconnectAttempt.current = 0;
      socket.send(JSON.stringify({ type: "auth", id: userId, name: userName }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "auth_ok") {
        setConnected(true);
        socket.send(JSON.stringify({ type: "list_all_users" }));
        return;
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, data]);
        listeners.current.forEach((fn) => fn(data));
        return;
      }

      if (data.type === "global_message") {
        setGlobalMessages((prev) => [...prev, data]);
        return;
      }

      if (data.type === "user_list") {
        setOnlineUsers(data.users);
        return;
      }

      if (data.type === "all_users") {
        setAllUsers(data.users);
        return;
      }

      if (data.type === "contact_added") {
        setLastContactAdded(data);
        setContactAddedCount((c) => c + 1);
        return;
      }

      if (data.type === "add_contact_confirm") {
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
      if (socket !== ws.current) return;
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
  }, [userId, userName]);

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

  const sendGlobalMessage = useCallback((text) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "global_message", text }));
    }
  }, []);

  const sendTyping = useCallback((to, typing) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "typing", to, typing }));
    }
  }, []);

  const requestAllUsers = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "list_all_users" }));
    }
  }, []);

  const sendAddContact = useCallback((contactId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "add_contact", contactId }));
    }
  }, []);

  const onMessage = useCallback((fn) => {
    listeners.current.push(fn);
    return () => {
      listeners.current = listeners.current.filter((l) => l !== fn);
    };
  }, []);

  return { connected, messages, globalMessages, onlineUsers, allUsers, typingUsers, sendMessage, sendGlobalMessage, sendTyping, requestAllUsers, onMessage, sendAddContact, lastContactAdded, contactAddedCount };
}
