"use client";

import { useEffect, useState, useRef } from "react";
import Conversations from "@/hooks/Contaversations";
import styles from "./css/Chat.module.css";

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat({ userId, contactId, contactName, wsMessages, sendMessage, typingUsers, sendTyping }) {
  const [mensagens, setMensagens] = useState([]);
  const [inputMensagem, setInputMensagem] = useState("");
  const { getConversations, salvarMensagem } = Conversations();
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const processedIds = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!userId || !contactId) return;
    const msgs = getConversations(userId, contactId);
    msgs.forEach((m) => {
      if (m.id) processedIds.current.add(m.id);
    });
    setMensagens(msgs);
  }, [userId, contactId]);

  useEffect(() => {
    if (!userId || !contactId) return;
    const relevant = wsMessages.filter(
      (m) =>
        String(m.from) === String(contactId) &&
        String(m.from) !== String(userId)
    );
    if (relevant.length === 0) return;

    setMensagens((prev) => {
      const existingIds = new Set(prev.map((m) => m.id).filter(Boolean));
      let changed = false;
      const merged = [...prev];

      relevant.forEach((m) => {
        if (m.id && !existingIds.has(m.id)) {
          existingIds.add(m.id);
          const mapped = {
            id: m.id,
            enviadoPor: String(m.from),
            texto: m.text,
            data: m.data,
            delivered: m.delivered,
          };
          merged.push(mapped);
          salvarMensagem(String(m.from), String(m.to), mapped.texto, mapped.data, mapped.id);
          changed = true;
        }
      });

      return changed ? merged : prev;
    });
  }, [wsMessages, userId, contactId]);

  useEffect(() => {
    if (!userId || !contactId) return;
    const delivered = wsMessages.filter(
      (m) =>
        String(m.from) === String(userId) &&
        String(m.to) === String(contactId) &&
        m.delivered
    );
    if (delivered.length === 0) return;

    setMensagens((prev) => {
      let changed = false;
      const updated = prev.map((m) => {
        if (
          !m.delivered &&
          String(m.enviadoPor) === String(userId) &&
          delivered.some((d) => d.text === m.texto)
        ) {
          changed = true;
          return { ...m, delivered: true };
        }
        return m;
      });
      return changed ? updated : prev;
    });
  }, [wsMessages, userId, contactId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, typingUsers]);

  function enviaMensagem(e) {
    if (e) e.preventDefault();
    if (!inputMensagem.trim()) return;

    const tempData = new Date().toISOString();
    const tempId = Date.now() + "_" + Math.random();

    salvarMensagem(userId, contactId, inputMensagem, tempData, tempId);

    if (sendMessage) {
      sendMessage(contactId, inputMensagem);
    }

    const msgs = getConversations(userId, contactId);
    msgs.forEach((m) => {
      if (m.id) processedIds.current.add(m.id);
    });
    setMensagens(msgs);
    setInputMensagem("");
  }

  function handleTyping(typing) {
    if (sendTyping) {
      sendTyping(contactId, typing);
    }
  }

  const isTyping = typingUsers && typingUsers[contactId];

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <div className={styles.avatar}>
            {contactId ? String(contactId).charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <span className={styles.contactName}>
              {contactName || (contactId ? `Contato ${contactId}` : "Selecione um contato")}
            </span>
            {isTyping && <span className={styles.typingIndicator}>digitando...</span>}
          </div>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {mensagens.map((mensagem, index) => {
          const isMine = String(mensagem.enviadoPor) === String(userId);
          return (
            <div
              key={mensagem.id || index}
              className={`${styles.messageRow} ${isMine ? styles.messageRowSent : styles.messageRowReceived}`}
            >
              <div
                className={`${styles.messageBubble} ${isMine ? styles.messageSent : styles.messageReceived}`}
              >
                <span className={styles.messageText}>{mensagem.texto}</span>
                <span className={styles.messageMeta}>
                  <span className={styles.messageTime}>
                    {mensagem.data ? formatTime(mensagem.data) : ""}
                  </span>
                  {isMine && mensagem.delivered && (
                    <span className={styles.deliveredIcon}>&#10003;&#10003;</span>
                  )}
                </span>
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
          onChange={(e) => {
            setInputMensagem(e.target.value);
            handleTyping(true);
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => handleTyping(false), 2000);
          }}
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
