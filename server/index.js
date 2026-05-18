const { WebSocketServer } = require("ws");

const PORT = 3030;
const wss = new WebSocketServer({ port: PORT });

const users = new Map();
const pendentesPorUser = new Map();
let msgCounter = 0;

wss.on("listening", () => {
  console.log(`\u{1F7E2} WebSocket server running on ws://localhost:${PORT}`);
});

wss.on("connection", (ws) => {
  let userId = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type } = msg;

      if (type === "auth") {
        userId = msg.id;
        users.set(userId, ws);
        console.log(`User ${userId} connected`);

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
        const list = Array.from(users.keys()).map((id) => ({
          id,
          online: true,
        }));
        ws.send(JSON.stringify({ type: "user_list", users: list }));
        return;
      }
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  ws.on("close", () => {
    if (userId) {
      console.log(`User ${userId} disconnected`);
      users.delete(userId);
      broadcastUserList();
    }
  });

  ws.on("error", () => {});
});

function broadcastUserList() {
  const list = Array.from(users.keys()).map((id) => ({ id, online: true }));
  const payload = JSON.stringify({ type: "user_list", users: list });
  users.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}
