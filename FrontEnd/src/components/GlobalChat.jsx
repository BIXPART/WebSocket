"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./css/GlobalChat.module.css";

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GlobalChat({ userId, globalMessages, sendGlobalMessage, onlineUsers, allUsers }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [globalMessages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    sendGlobalMessage(input.trim());
    setInput("");
  }

  const onlineCount = onlineUsers?.length || 0;
  const totalCount = allUsers?.length || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.title}>Chat Global</span>
          <span className={styles.subtitle}>{onlineCount} online · {totalCount} registrados</span>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {globalMessages.length === 0 && (
          <div className={styles.emptyState}>
            Nenhuma mensagem global ainda. Seja o primeiro a enviar!
          </div>
        )}
        {globalMessages.map((msg, index) => {
          const isMine = String(msg.from) === String(userId);
          return (
            <div
              key={msg.id || index}
              className={`${styles.messageRow} ${isMine ? styles.messageRowSent : styles.messageRowReceived}`}
            >
              <div className={styles.senderInfo}>
                <span className={styles.senderName}>{msg.fromName || `User ${msg.from}`}</span>
                <span className={styles.messageTime}>{msg.data ? formatTime(msg.data) : ""}</span>
              </div>
              <div
                className={`${styles.messageBubble} ${isMine ? styles.messageSent : styles.messageReceived}`}
              >
                <span className={styles.messageText}>{msg.text}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSend}>
        <input
          type="text"
          className={styles.inputField}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem para todos..."
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!input.trim()}
        >
          <svg className={styles.sendIcon} viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
