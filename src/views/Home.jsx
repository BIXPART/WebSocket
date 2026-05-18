"use client";

import Headler from "@/layout/Headler";
import ListContats from "@/components/ListContats";
import Footer from "@/layout/Footer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UsuariosIniciais from "@/hooks/UsuariosIniciais";
import Chat from "@/components/Chat";
import useWebSocket from "@/hooks/useWebSocket";
import whatszap2 from "../assets/whatszap2.png";

import styles from "./css/Home.module.css";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [user, setUser] = useState(null);
  const [contactId, setContactId] = useState(null);
  const [contactName, setContactName] = useState("");

  const ws = useWebSocket(user?.id);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem("usuarios")) {
      UsuariosIniciais();
    }
    const tokenStr = localStorage.getItem("token");
    if (tokenStr) {
      const token = JSON.parse(tokenStr);
      setUser(token);
      setHasToken(true);
    }
  }, []);

  function handleSelectContact(contato) {
    setContactId(contato.id);
    setContactName(contato.nome);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setHasToken(false);
    setUser(null);
    setContactId(null);
    router.push("/");
  }

  if (!mounted) return null;

  if (hasToken && user) {
    return (
      <div className={styles.page}>
        <Headler onLogout={handleLogout} />
        <main className={styles.chatMain}>
          <ListContats
            onSelectContact={handleSelectContact}
            selectedId={contactId}
            onlineUsers={ws.onlineUsers}
          />
          <div className={styles.chatPlaceholder}>
            {!ws.connected && (
              <div className={styles.reconnectBanner}>
                Reconectando ao servidor...
              </div>
            )}
            {contactId ? (
              <Chat
                userId={user.id}
                contactId={contactId}
                wsMessages={ws.messages}
                sendMessage={ws.sendMessage}
                typingUsers={ws.typingUsers}
                sendTyping={ws.sendTyping}
              />
            ) : (
              <div className={styles.noChat}>
                <div className={styles.noChatIcon}>
                  <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
                  </svg>
                </div>
                <h2 className={styles.noChatTitle}>Whatszap2</h2>
                <p className={styles.noChatText}>
                  Selecione um contato para começar a conversar
                </p>
                <div className={`${styles.statusDot} ${ws.connected ? styles.online : styles.offline}`} />
                <span className={styles.wsStatus}>
                  {ws.connected ? "Conectado ao servidor" : "Desconectado"}
                </span>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Headler />
      <main className={styles.main}>
        <img src={whatszap2.src} alt="Whatszap Logo" className={styles.logo} />

        <h2 className={styles.subtitle}>Já tem uma conta? entre</h2>
        <button
          className={styles.button}
          onClick={() => router.push("/login")}
        >
          Login
        </button>

        <h2 className={styles.subtitle}>Não tem uma conta? cadastre-se</h2>
        <button
          className={styles.button}
          onClick={() => router.push("/cadastro")}
        >
          Cadastrar
        </button>
      </main>
      <Footer />
    </div>
  );
}
