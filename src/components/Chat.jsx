"use client";

import { useEffect, useState, useRef } from "react";
import Conversations from "@/hooks/Contaversations";
import styles from "./css/Chat.module.css";

export default function Chat({ userId, contactId, wsMessages, sendMessage }) {
  const [mensagens, setMensagens] = useState([]);
  const [inputMensagem, setInputMensagem] = useState("");
  const { getConversations, salvarMensagem } = Conversations();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load local messages on mount & when contact changes
  useEffect(() => {
    if (!userId || !contactId) return;
    const msgs = getConversations(userId, contactId);
    setMensagens(msgs);
  }, [userId, contactId]);

  // Merge incoming WebSocket messages relevant to this chat
  useEffect(() => {
    if (!userId || !contactId) return;
    const relevant = wsMessages.filter(
      (m) =>
        (m.from == userId && m.to == contactId) ||
        (m.from == contactId && m.to == userId)
    );
    if (relevant.length > 0) {
      setMensagens((prev) => {
        const existingKeys = new Set(prev.map((m) => m.data + m.texto));
        const newOnes = relevant.filter(
          (m) => !existingKeys.has(m.data + m.text)
        );
        if (newOnes.length === 0) return prev;
        const mapped = newOnes.map((m) => ({
          enviadoPor: String(m.from),
          texto: m.text,
          data: m.data,
        }));
        const merged = [...prev, ...mapped];
        // persist to localStorage
        merged.forEach((m) => salvarMensagem(m.enviadoPor, contactId, m.texto));
        return merged;
      });
    }
  }, [wsMessages, userId, contactId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  function enviaMensagem(e) {
    if (e) e.preventDefault();
    if (!inputMensagem.trim()) return;

    salvarMensagem(userId, contactId, inputMensagem);

    if (sendMessage) {
      sendMessage(contactId, inputMensagem);
    }

    const msgs = getConversations(userId, contactId);
    setMensagens(msgs);
    setInputMensagem("");
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <div className={styles.avatar}>
            {contactId ? String(contactId).charAt(0).toUpperCase() : "?"}
          </div>
          <span className={styles.contactName}>
            {contactId ? `Contato ${contactId}` : "Selecione um contato"}
          </span>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {mensagens.map((mensagem, index) => {
          const isMine = String(mensagem.enviadoPor) === String(userId);
          return (
            <div
              key={index}
              className={`${styles.messageRow} ${isMine ? styles.messageRowSent : styles.messageRowReceived}`}
            >
              <div
                className={`${styles.messageBubble} ${isMine ? styles.messageSent : styles.messageReceived}`}
              >
                {mensagem.texto}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={enviaMensagem}>
        <input
          type="text"
          className={styles.inputField}
          value={inputMensagem}
          onChange={(e) => setInputMensagem(e.target.value)}
          placeholder="Digite uma mensagem"
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!inputMensagem.trim()}
        >
          <svg className={styles.sendIcon} viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
