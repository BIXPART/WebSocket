const { WebSocketServer } = require("ws");

const PORT = 3030;
const wss = new WebSocketServer({ port: PORT });

const users = new Map();
const userRegistry = new Map();
const pendentesPorUser = new Map();
let msgCounter = 0;
let globalMsgCounter = 0;

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
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  ws.on("close", () => {
    if (userId) {
      if (users.get(userId) === ws) {
        console.log(`User ${userId} disconnected`);
        users.delete(userId);
        broadcastUserList();
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
