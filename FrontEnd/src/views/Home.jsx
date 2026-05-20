"use client";

import Headler from "@/layout/Headler";
import ListContats from "@/components/ListContats";
import GlobalChat from "@/components/GlobalChat";
import Footer from "@/layout/Footer";
import { useEffect, useState, useMemo } from "react";
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
  const [tab, setTab] = useState("conversas");
  const [showAddContact, setShowAddContact] = useState(false);

  const ws = useWebSocket(user?.id, user?.nome);

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

  function addContact(contactUser) {
    if (!user) return;
    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const updatedUser = { ...user, contatos: [...(user.contatos || [])] };
    const contactIdNum = Number(contactUser.id);
    if (updatedUser.contatos.includes(contactIdNum)) return;
    updatedUser.contatos.push(contactIdNum);
    const userIndex = usuarios.findIndex((u) => String(u.id) === String(user.id));
    if (userIndex !== -1) {
      usuarios[userIndex] = updatedUser;
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }
    localStorage.setItem("token", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setShowAddContact(false);
  }

  const isMyContact = (idu) => user?.contatos?.some((c) => String(c) === String(idu));

  const allAvailableUsers = useMemo(() => {
    if (typeof window === "undefined" || !user) return [];
    const localUsuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const serverUsers = ws.allUsers || [];
    const merged = new Map();
    localUsuarios.forEach((u) => merged.set(String(u.id), { id: u.id, name: u.nome }));
    serverUsers.forEach((u) => {
      if (merged.has(String(u.id))) {
        merged.set(String(u.id), { ...merged.get(String(u.id)), name: u.name });
      } else {
        merged.set(String(u.id), { id: u.id, name: u.name || `User ${u.id}` });
      }
    });
    return Array.from(merged.values()).filter(
      (u) => !isMyContact(u.id) && String(u.id) !== String(user?.id)
    );
  }, [ws.allUsers, user]);

  if (!mounted) return null;

  if (hasToken && user) {
    return (
      <div className={styles.page}>
        <Headler onLogout={handleLogout} />
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${tab === "conversas" ? styles.tabActive : ""}`}
            onClick={() => { setTab("conversas"); setContactId(null); }}
          >
            Conversas
          </button>
          <button
            className={`${styles.tab} ${tab === "global" ? styles.tabActive : ""}`}
            onClick={() => { setTab("global"); setContactId(null); }}
          >
            Chat Global
          </button>
        </div>
        <main className={styles.chatMain}>
          {(tab === "conversas") ? (
            <>
              <ListContats
                onSelectContact={handleSelectContact}
                selectedId={contactId}
                onlineUsers={ws.onlineUsers}
                onAddContact={() => setShowAddContact(true)}
                user={user}
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
                    contactName={contactName}
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
            </>
          ) : (
            <>
              <div className={styles.globalUserList}>
                <div className={styles.globalUserHeader}>Usuários Online</div>
                <ul>
                  {ws.onlineUsers.map((u) => (
                    <li key={u.id} className={styles.globalUserItem}>
                      <div className={styles.globalUserAvatar}>
                        {(u.name || `User ${u.id}`).charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.globalUserInfo}>
                        <span className={styles.globalUserName}>{u.name || `User ${u.id}`}</span>
                        <span className={styles.globalUserStatus}>Online</span>
                      </div>
                      {!isMyContact(u.id) && String(u.id) !== String(user.id) && (
                        <button
                          className={styles.addContactSmall}
                          onClick={() => addContact(u)}
                          title="Adicionar aos contatos"
                        >
                          +
                        </button>
                      )}
                    </li>
                  ))}
                  {ws.onlineUsers.length === 0 && (
                    <li className={styles.emptyState}>Nenhum usuário online</li>
                  )}
                </ul>
              </div>
              <div className={styles.chatPlaceholder}>
                {!ws.connected && (
                  <div className={styles.reconnectBanner}>
                    Reconectando ao servidor...
                  </div>
                )}
                <GlobalChat
                  userId={user.id}
                  globalMessages={ws.globalMessages}
                  sendGlobalMessage={ws.sendGlobalMessage}
                  onlineUsers={ws.onlineUsers}
                  allUsers={ws.allUsers}
                />
              </div>
            </>
          )}
        </main>

        {showAddContact && (
          <div className={styles.modalOverlay} onClick={() => setShowAddContact(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Adicionar Contato</h3>
                <button className={styles.modalClose} onClick={() => setShowAddContact(false)}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                {allAvailableUsers.length === 0 && (
                  <p className={styles.emptyState}>Nenhum usuário disponível</p>
                )}
                {allAvailableUsers.map((u) => (
                  <div key={u.id} className={styles.modalUserItem}>
                    <div className={styles.modalUserAvatar}>
                      {(u.name || `User ${u.id}`).charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.modalUserInfo}>
                      <span className={styles.modalUserName}>{u.name || `User ${u.id}`}</span>
                      <span className={styles.modalUserStatus}>
                        {ws.onlineUsers.some((ou) => String(ou.id) === String(u.id)) ? "Online" : "Offline"}
                      </span>
                    </div>
                    <button className={styles.modalAddBtn} onClick={() => addContact(u)}>
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
