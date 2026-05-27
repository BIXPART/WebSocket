const { WebSocketServer } = require("ws");

const PORT = 3030;
const wss = new WebSocketServer({ port: PORT });

const users = new Map();
const userRegistry = new Map();
const pendentesPorUser = new Map();
const rooms = new Map();
const userRooms = new Map();
let msgCounter = 0;
let globalMsgCounter = 0;
let roomCounter = 0;

wss.on("listening", () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

wss.on("connection", (ws) => {
  let userId = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type } = msg;

      if (type === "auth") {
        userId = msg.id;
        const userName = msg.name || `User ${userId}`;
        users.set(userId, ws);
        userRegistry.set(userId, { id: userId, name: userName });
        console.log(`User ${userId} (${userName}) connected`);

        broadcastUserList();
        broadcastRoomList();

        const pendentes = pendentesPorUser.get(userId) || [];
        pendentes.forEach((m) => ws.send(JSON.stringify(m)));
        pendentesPorUser.delete(userId);

        ws.send(JSON.stringify({ type: "auth_ok", id: userId }));
        return;
      }

      if (type === "message") {
        const { to, text } = msg;
        const payload = {
          type: "message",
          id: ++msgCounter,
          from: userId,
          to,
          text,
          data: new Date().toISOString(),
        };

        const targetWs = users.get(to);
        if (targetWs && targetWs.readyState === 1) {
          targetWs.send(JSON.stringify(payload));
        } else {
          if (!pendentesPorUser.has(to)) {
            pendentesPorUser.set(to, []);
          }
          pendentesPorUser.get(to).push(payload);
        }

        if (userId) {
          ws.send(JSON.stringify({ ...payload, delivered: true }));
        }
        return;
      }

      if (type === "global_message") {
        const userInfo = userRegistry.get(userId);
        const payload = {
          type: "global_message",
          id: ++globalMsgCounter,
          from: userId,
          fromName: userInfo ? userInfo.name : `User ${userId}`,
          text: msg.text,
          data: new Date().toISOString(),
        };

        users.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(payload));
          }
        });
        return;
      }

      if (type === "typing") {
        const { to, typing } = msg;
        const targetWs = users.get(to);
        if (targetWs && targetWs.readyState === 1) {
          targetWs.send(JSON.stringify({
            type: "typing",
            from: userId,
            typing,
          }));
        }
        return;
      }

      if (type === "add_contact") {
        const { contactId, contactName: clientContactName } = msg;
        const contactInfo = userRegistry.get(contactId);
        const userInfo = userRegistry.get(userId);

        const contactName = contactInfo ? contactInfo.name : (clientContactName || `User ${contactId}`);

        const payload = {
          type: "contact_added",
          byUserId: userId,
          byUserName: userInfo ? userInfo.name : `User ${userId}`,
        };

        const targetWs = users.get(contactId);
        if (targetWs && targetWs.readyState === 1) {
          targetWs.send(JSON.stringify(payload));
        } else {
          if (!pendentesPorUser.has(contactId)) {
            pendentesPorUser.set(contactId, []);
          }
          pendentesPorUser.get(contactId).push(payload);
        }

        ws.send(JSON.stringify({
          type: "add_contact_confirm",
          contactId,
          contactName,
        }));
        return;
      }

      if (type === "search_users") {
        const { query } = msg;
        if (!query || query.trim().length < 1) {
          ws.send(JSON.stringify({ type: "search_users_result", users: [] }));
          return;
        }
        const lowerQuery = query.toLowerCase().trim();
        const results = Array.from(userRegistry.values()).filter(
          (u) => u.name.toLowerCase().includes(lowerQuery) && Number(u.id) !== Number(userId)
        );
        ws.send(JSON.stringify({ type: "search_users_result", users: results }));
        return;
      }

      if (type === "list_users") {
        const list = Array.from(users.keys()).map((id) => {
          const info = userRegistry.get(id) || { id, name: `User ${id}` };
          return { ...info, online: true };
        });
        ws.send(JSON.stringify({ type: "user_list", users: list }));
        return;
      }

      if (type === "list_all_users") {
        const list = Array.from(userRegistry.values());
        ws.send(JSON.stringify({ type: "all_users", users: list }));
        return;
      }

      if (type === "create_room") {
        const { name } = msg;
        if (!name || !name.trim()) {
          ws.send(JSON.stringify({ type: "error", message: "Nome da sala é obrigatório" }));
          return;
        }
        const roomId = ++roomCounter;
        const room = {
          id: roomId,
          name: name.trim(),
          createdBy: userId,
          members: new Set([userId]),
        };
        rooms.set(roomId, room);
        if (!userRooms.has(userId)) userRooms.set(userId, new Set());
        userRooms.get(userId).add(roomId);
        ws.send(JSON.stringify({ type: "room_created", room: { id: roomId, name: name.trim(), memberCount: 1 } }));
        broadcastRoomList();
        return;
      }

      if (type === "list_rooms") {
        const list = Array.from(rooms.values()).map((r) => ({
          id: r.id,
          name: r.name,
          memberCount: r.members.size,
          createdBy: r.createdBy,
        }));
        ws.send(JSON.stringify({ type: "rooms_list", rooms: list }));
        return;
      }

      if (type === "join_room") {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Sala não encontrada" }));
          return;
        }
        room.members.add(userId);
        if (!userRooms.has(userId)) userRooms.set(userId, new Set());
        userRooms.get(userId).add(roomId);
        ws.send(JSON.stringify({ type: "room_joined", roomId, name: room.name }));
        broadcastRoomUsers(roomId);
        broadcastRoomList();
        return;
      }

      if (type === "leave_room") {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (room) {
          room.members.delete(userId);
          if (userRooms.has(userId)) userRooms.get(userId).delete(roomId);
          broadcastRoomUsers(roomId);
          broadcastRoomList();
        }
        return;
      }

      if (type === "room_message") {
        const { roomId, text } = msg;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Sala não encontrada" }));
          return;
        }
        if (!room.members.has(userId)) {
          ws.send(JSON.stringify({ type: "error", message: "Você não é membro desta sala" }));
          return;
        }
        const userInfo = userRegistry.get(userId);
        const payload = {
          type: "room_message",
          id: ++globalMsgCounter,
          roomId,
          from: userId,
          fromName: userInfo ? userInfo.name : `User ${userId}`,
          text,
          data: new Date().toISOString(),
        };
        room.members.forEach((memberId) => {
          const memberWs = users.get(memberId);
          if (memberWs && memberWs.readyState === 1) {
            memberWs.send(JSON.stringify(payload));
          }
        });
        return;
      }

      if (type === "list_room_users") {
        const { roomId } = msg;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Sala não encontrada" }));
          return;
        }
        const list = Array.from(room.members).map((memberId) => {
          const info = userRegistry.get(memberId) || { id: memberId, name: `User ${memberId}` };
          const memberWs = users.get(memberId);
          return { ...info, online: memberWs && memberWs.readyState === 1 };
        });
        ws.send(JSON.stringify({ type: "room_users", roomId, users: list }));
        return;
      }
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  ws.on("close", () => {
    if (userId) {
      if (users.get(userId) === ws) {
        console.log(`User ${userId} disconnected`);
        users.delete(userId);
        if (userRooms.has(userId)) {
          userRooms.get(userId).forEach((roomId) => {
            const room = rooms.get(roomId);
            if (room) {
              room.members.delete(userId);
              broadcastRoomUsers(roomId);
            }
          });
          userRooms.delete(userId);
        }
        broadcastUserList();
        broadcastRoomList();
      }
    }
  });

  ws.on("error", () => {});
});

function broadcastUserList() {
  const list = Array.from(users.keys()).map((id) => {
    const info = userRegistry.get(id) || { id, name: `User ${id}` };
    return { ...info, online: true };
  });
  const payload = JSON.stringify({ type: "user_list", users: list });
  users.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

function broadcastRoomList() {
  const list = Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    memberCount: r.members.size,
    createdBy: r.createdBy,
  }));
  const payload = JSON.stringify({ type: "rooms_list", rooms: list });
  users.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

function broadcastRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const list = Array.from(room.members).map((memberId) => {
    const info = userRegistry.get(memberId) || { id: memberId, name: `User ${memberId}` };
    const memberWs = users.get(memberId);
    return { ...info, online: memberWs && memberWs.readyState === 1 };
  });
  const payload = JSON.stringify({ type: "room_users", roomId, users: list });
  room.members.forEach((memberId) => {
    const memberWs = users.get(memberId);
    if (memberWs && memberWs.readyState === 1) {
      memberWs.send(payload);
    }
  });
}
