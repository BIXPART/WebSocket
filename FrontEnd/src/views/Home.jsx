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
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessageMode, setRoomMessageMode] = useState("all");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [roomMessageInput, setRoomMessageInput] = useState("");

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

  useEffect(() => {
    if (ws.contactAddedCount === 0 || !user) return;

    const events = ws.getContactAddedEvents();
    ws.clearContactAddedEvents();

    for (const event of events) {
      const byUserId = Number(event.byUserId);
      if (byUserId === Number(user.id)) continue;

      const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
      const existingUser = usuarios.find((u) => Number(u.id) === byUserId);

      if (!existingUser) {
        usuarios.push({
          id: byUserId,
          nome: event.byUserName,
          email: "",
          senha: "",
          contatos: [Number(user.id)],
        });
      } else {
        const idx = usuarios.findIndex((u) => Number(u.id) === byUserId);
        if (!usuarios[idx].contatos.includes(Number(user.id))) {
          usuarios[idx].contatos.push(Number(user.id));
        }
      }

      const updatedUser = { ...user, contatos: [...(user.contatos || [])] };
      if (!updatedUser.contatos.includes(byUserId)) {
        updatedUser.contatos.push(byUserId);
      }

      const userIndex = usuarios.findIndex((u) => Number(u.id) === Number(user.id));
      if (userIndex !== -1) {
        usuarios[userIndex] = updatedUser;
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
      }
      localStorage.setItem("token", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, [ws.contactAddedCount, user]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (showAddContact && ws.requestAllUsers) {
      ws.requestAllUsers();
    }
  }, [showAddContact]);

  useEffect(() => {
    if (ws.connected && ws.requestRooms) {
      ws.requestRooms();
    }
  }, [ws.connected]);

  useEffect(() => {
    if (!selectedRoom) return;
    ws.joinRoom(selectedRoom.id);
    ws.requestRoomUsers(selectedRoom.id);
    const interval = setInterval(() => ws.requestRoomUsers(selectedRoom.id), 5000);
    return () => {
      clearInterval(interval);
      ws.leaveRoom(selectedRoom.id);
    };
  }, [selectedRoom]);

  useEffect(() => {
    const unsub = ws.onMessage((data) => {
      if (data.type === "add_contact_confirm") {
        setNotification({ message: `${data.contactName} foi adicionado aos contatos!`, type: "success" });
      }
      if (data.type === "room_created") {
        setSelectedRoom(data.room);
      }
      if (data.type === "error") {
        setNotification({ message: data.message, type: "error" });
      }
    });
    return unsub;
  }, [ws.onMessage]);

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

      const contactIdx = usuarios.findIndex((u) => Number(u.id) === contactIdNum);
      if (contactIdx !== -1) {
        const contactUpdated = { ...usuarios[contactIdx] };
        if (!contactUpdated.contatos) contactUpdated.contatos = [];
        if (!contactUpdated.contatos.includes(Number(user.id))) {
          contactUpdated.contatos.push(Number(user.id));
        }
        usuarios[contactIdx] = contactUpdated;
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
      }
    }
    localStorage.setItem("token", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setShowAddContact(false);
    setSearchQuery("");

    if (ws.sendAddContact) {
      ws.sendAddContact(contactIdNum, contactUser.name || contactUser.nome);
    }
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

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allAvailableUsers;
    const q = searchQuery.toLowerCase().trim();
    return allAvailableUsers.filter((u) =>
      (u.name || "").toLowerCase().includes(q)
    );
  }, [allAvailableUsers, searchQuery]);

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
          <button
            className={`${styles.tab} ${tab === "salas" ? styles.tabActive : ""}`}
            onClick={() => { setTab("salas"); setContactId(null); setSelectedRoom(null); }}
          >
            Salas
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
          ) : (tab === "global") ? (
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
          ) : (
            <>
              <div className={styles.globalUserList}>
                <div className={styles.globalUserHeader}>
                  Salas
                  <button className={styles.addContactSmall} onClick={() => setShowCreateRoom(true)} title="Criar sala">+</button>
                </div>
                <ul>
                  {ws.rooms.map((room) => (
                    <li key={room.id} className={styles.globalUserItem}>
                      <div className={styles.globalUserAvatar}>
                        {room.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.globalUserInfo}>
                        <span className={styles.globalUserName}>{room.name}</span>
                        <span className={styles.globalUserStatus}>{room.memberCount} membro(s)</span>
                      </div>
                      <button
                        className={`${styles.roomJoinBtn} ${selectedRoom?.id === room.id ? styles.roomJoinBtnActive : ""}`}
                        onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
                      >
                        {selectedRoom?.id === room.id ? "Sair" : "Entrar"}
                      </button>
                    </li>
                  ))}
                  {ws.rooms.length === 0 && (
                    <li className={styles.emptyState}>Nenhuma sala disponível</li>
                  )}
                </ul>
              </div>
              <div className={styles.chatPlaceholder}>
                {!ws.connected && (
                  <div className={styles.reconnectBanner}>
                    Reconectando ao servidor...
                  </div>
                )}
                {selectedRoom ? (
                  <div className={styles.roomChatContainer}>
                    <div className={styles.chatHeader}>
                      <div className={styles.chatHeaderInfo}>
                        <span className={styles.contactName}>{selectedRoom.name}</span>
                        <span className={styles.modalUserStatus}>
                          {(ws.roomUsers[selectedRoom.id] || []).filter((u) => u.online).length} online
                        </span>
                      </div>
                      <div className={styles.roomModeToggle}>
                        <button
                          className={`${styles.modeBtn} ${roomMessageMode === "all" ? styles.modeBtnActive : ""}`}
                          onClick={() => setRoomMessageMode("all")}
                        >
                          Para todos
                        </button>
                        <button
                          className={`${styles.modeBtn} ${roomMessageMode === "select" ? styles.modeBtnActive : ""}`}
                          onClick={() => { setRoomMessageMode("select"); setSelectedRecipients([]); }}
                        >
                          Selecionar
                        </button>
                      </div>
                    </div>
                    <div className={styles.roomMembers}>
                      {(ws.roomUsers[selectedRoom.id] || []).map((u) => (
                        <div
                          key={u.id}
                          className={`${styles.roomMemberItem} ${roomMessageMode === "select" && selectedRecipients.includes(u.id) ? styles.roomMemberSelected : ""}`}
                          onClick={() => {
                            if (roomMessageMode !== "select") return;
                            setSelectedRecipients((prev) =>
                              prev.includes(u.id)
                                ? prev.filter((id) => id !== u.id)
                                : [...prev, u.id]
                            );
                          }}
                        >
                          <span className={`${styles.roomMemberDot} ${u.online ? styles.online : styles.offline}`} />
                          <span className={styles.roomMemberName}>{u.name || `User ${u.id}`}</span>
                          {roomMessageMode === "select" && selectedRecipients.includes(u.id) && (
                            <span className={styles.roomMemberCheck}>&#10003;</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className={styles.messagesArea}>
                      {(ws.roomMessages[selectedRoom.id] || []).map((msg, index) => {
                        const isMine = String(msg.from) === String(user.id);
                        return (
                          <div key={msg.id || index} className={`${styles.messageRowRoom} ${isMine ? styles.messageRowSent : styles.messageRowReceived}`}>
                            <div className={styles.senderInfo}>
                              <span className={styles.senderName}>{msg.fromName || `User ${msg.from}`}</span>
                              <span className={styles.messageTime}>{msg.data ? new Date(msg.data).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                            </div>
                            <div className={`${styles.messageBubbleRoom} ${isMine ? styles.messageSent : styles.messageReceived}`}>
                              <span className={styles.messageText}>{msg.text}</span>
                            </div>
                          </div>
                        );
                      })}
                      {(ws.roomMessages[selectedRoom.id] || []).length === 0 && (
                        <div className={styles.emptyState}>Nenhuma mensagem na sala</div>
                      )}
                    </div>
                    <form className={styles.inputArea} onSubmit={(e) => {
                      e.preventDefault();
                      if (!roomMessageInput.trim()) return;
                      if (roomMessageMode === "select" && selectedRecipients.length > 0) {
                        selectedRecipients.forEach((recipientId) => {
                          ws.sendMessage(recipientId, roomMessageInput.trim());
                        });
                        setNotification({ message: `Mensagem enviada para ${selectedRecipients.length} usuário(s)`, type: "success" });
                      } else {
                        ws.sendRoomMessage(selectedRoom.id, roomMessageInput.trim());
                      }
                      setRoomMessageInput("");
                      setSelectedRecipients([]);
                    }}>
                      <input
                        type="text"
                        className={styles.inputField}
                        value={roomMessageInput}
                        onChange={(e) => setRoomMessageInput(e.target.value)}
                        placeholder={roomMessageMode === "all" ? "Enviar para todos na sala..." : "Selecione os destinatários e digite..."}
                      />
                      <button type="submit" className={styles.sendButton} disabled={!roomMessageInput.trim()}>
                        <svg className={styles.sendIcon} viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className={styles.noChat}>
                    <h2 className={styles.noChatTitle}>Salas</h2>
                    <p className={styles.noChatText}>
                      Selecione uma sala para entrar ou crie uma nova
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {showAddContact && (
          <div className={styles.modalOverlay} onClick={() => { setShowAddContact(false); setSearchQuery(""); }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Adicionar Contato</h3>
                <button className={styles.modalClose} onClick={() => { setShowAddContact(false); setSearchQuery(""); }}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.searchContainer}>
                  <svg className={styles.searchIcon} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Buscar por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {filteredUsers.length === 0 && (
                  <p className={styles.emptyState}>
                    {searchQuery.trim() ? "Nenhum usuário encontrado" : "Nenhum usuário disponível"}
                  </p>
                )}
                {filteredUsers.map((u) => (
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

        {showCreateRoom && (
          <div className={styles.modalOverlay} onClick={() => { setShowCreateRoom(false); setNewRoomName(""); }}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Criar Sala</h3>
                <button className={styles.modalClose} onClick={() => { setShowCreateRoom(false); setNewRoomName(""); }}>&times;</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.searchContainer}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Nome da sala..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newRoomName.trim()) {
                        ws.createRoom(newRoomName.trim());
                        setShowCreateRoom(false);
                        setNewRoomName("");
                      }
                    }}
                  />
                </div>
                <button
                  className={styles.modalAddBtn}
                  style={{ width: "100%", padding: "0.6rem", marginTop: "0.5rem" }}
                  onClick={() => {
                    if (newRoomName.trim()) {
                      ws.createRoom(newRoomName.trim());
                      setShowCreateRoom(false);
                      setNewRoomName("");
                    }
                  }}
                >
                  Criar Sala
                </button>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <div className={`${styles.toast} ${notification.type === "success" ? styles.toastSuccess : notification.type === "error" ? styles.toastError : ""}`}>
            {notification.message}
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
