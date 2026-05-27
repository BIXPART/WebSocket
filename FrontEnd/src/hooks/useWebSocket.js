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
  const [contactAddedCount, setContactAddedCount] = useState(0);
  const contactAddedQueue = useRef([]);
  const [searchResults, setSearchResults] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomMessages, setRoomMessages] = useState({});
  const [roomUsers, setRoomUsers] = useState({});
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
        contactAddedQueue.current.push(data);
        setContactAddedCount((c) => c + 1);
        return;
      }

      if (data.type === "add_contact_confirm") {
        listeners.current.forEach((fn) => fn(data));
        return;
      }

      if (data.type === "search_users_result") {
        setSearchResults(data.users);
        return;
      }

      if (data.type === "typing") {
        setTypingUsers((prev) => ({
          ...prev,
          [data.from]: data.typing,
        }));
        return;
      }

      if (data.type === "rooms_list") {
        setRooms(data.rooms);
        return;
      }

      if (data.type === "room_created") {
        setRooms((prev) => {
          const exists = prev.find((r) => r.id === data.room.id);
          if (exists) return prev;
          return [...prev, data.room];
        });
        return;
      }

      if (data.type === "room_joined") {
        listeners.current.forEach((fn) => fn(data));
        return;
      }

      if (data.type === "room_message") {
        setRoomMessages((prev) => {
          const roomId = String(data.roomId);
          const existing = prev[roomId] || [];
          if (existing.some((m) => m.id === data.id)) return prev;
          return { ...prev, [roomId]: [...existing, data] };
        });
        return;
      }

      if (data.type === "room_users") {
        setRoomUsers((prev) => ({
          ...prev,
          [data.roomId]: data.users,
        }));
        return;
      }

      if (data.type === "error") {
        listeners.current.forEach((fn) => fn(data));
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

  const sendAddContact = useCallback((contactId, contactName) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "add_contact", contactId, contactName }));
    }
  }, []);

  const searchUsers = useCallback((query) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "search_users", query }));
    }
  }, []);

  const getContactAddedEvents = useCallback(() => {
    return [...contactAddedQueue.current];
  }, []);

  const clearContactAddedEvents = useCallback(() => {
    contactAddedQueue.current = [];
  }, []);

  const createRoom = useCallback((name) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "create_room", name }));
    }
  }, []);

  const requestRooms = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "list_rooms" }));
    }
  }, []);

  const joinRoom = useCallback((roomId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "join_room", roomId }));
    }
  }, []);

  const leaveRoom = useCallback((roomId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "leave_room", roomId }));
    }
  }, []);

  const sendRoomMessage = useCallback((roomId, text) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "room_message", roomId, text }));
    }
  }, []);

  const requestRoomUsers = useCallback((roomId) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "list_room_users", roomId }));
    }
  }, []);

  const onMessage = useCallback((fn) => {
    listeners.current.push(fn);
    return () => {
      listeners.current = listeners.current.filter((l) => l !== fn);
    };
  }, []);

  return { connected, messages, globalMessages, onlineUsers, allUsers, typingUsers, searchResults, rooms, roomMessages, roomUsers, sendMessage, sendGlobalMessage, sendTyping, requestAllUsers, searchUsers, createRoom, requestRooms, joinRoom, leaveRoom, sendRoomMessage, requestRoomUsers, onMessage, sendAddContact, getContactAddedEvents, clearContactAddedEvents, contactAddedCount };
}
