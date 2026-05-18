"use client";

import { useState, useEffect } from "react";
import styles from "./css/ListContats.module.css";

export default function ListContats({ onSelectContact, selectedId, onlineUsers }) {
  const [contatos, setContatos] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tokenStr = localStorage.getItem("token");
    const usuariosStr = localStorage.getItem("usuarios");
    if (tokenStr && usuariosStr) {
      const token = JSON.parse(tokenStr);
      const usuarios = JSON.parse(usuariosStr);
      const contatosIds = (token.contatos || []).map(String);
      setContatos(
        usuarios.filter((c) => contatosIds.includes(String(c.id)))
      );
    }
  }, []);

  const getColorClass = (id) => {
    const colors = [styles.color1, styles.color2, styles.color3, styles.color4, styles.color5];
    return colors[Number(id) % colors.length];
  };

  const isOnline = (id) => onlineUsers?.some((u) => String(u.id) === String(id));

  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>Conversas</div>
      <ul className={styles.list}>
        {contatos.map((contato) => (
          <li key={contato.id}>
            <button
              className={`${styles.contactItem} ${String(selectedId) === String(contato.id) ? styles.selected : ""}`}
              onClick={() => onSelectContact(contato)}
            >
              <div className={`${styles.avatar} ${getColorClass(contato.id)}`}>
                {contato.nome.charAt(0).toUpperCase()}
                <span className={`${styles.statusDot} ${isOnline(contato.id) ? styles.statusOnline : styles.statusOffline}`} />
              </div>
              <div className={styles.contactInfo}>
                <div className={styles.topLine}>
                  <span className={styles.contactName}>{contato.nome}</span>
                  <span className={`${styles.statusBadge} ${isOnline(contato.id) ? styles.statusBadgeOnline : styles.statusBadgeOffline}`}>
                    {isOnline(contato.id) ? "online" : "offline"}
                  </span>
                </div>
                <div className={styles.bottomLine}>
                  <span className={styles.contactStatus}>Toque para conversar</span>
                </div>
              </div>
            </button>
          </li>
        ))}
        {contatos.length === 0 && (
          <li className={styles.emptyState}>Nenhum contato disponível</li>
        )}
      </ul>
    </div>
  );
}
