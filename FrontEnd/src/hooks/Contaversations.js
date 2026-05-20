export default function Conversations() {

    function getChatId(id1, id2) {
        return [id1, id2].sort((a, b) => String(a).localeCompare(String(b))).join("_");
    }

    function salvarMensagem(idRemetente, idDestinatario, texto, data, id) {
        const chatId = getChatId(idRemetente, idDestinatario);

        const todasConversas = JSON.parse(localStorage.getItem("conversas") || "{}");

        if (!todasConversas[chatId]) {
            todasConversas[chatId] = [];
        }

        const msgId = id || Date.now() + "_" + Math.random();
        const existingIndex = todasConversas[chatId].findIndex((m) => String(m.id) === String(msgId));

        const entry = {
            id: msgId,
            enviadoPor: String(idRemetente),
            texto: texto,
            data: data || new Date().toISOString(),
        };

        if (existingIndex !== -1) {
            todasConversas[chatId][existingIndex] = entry;
        } else {
            todasConversas[chatId].push(entry);
        }

        localStorage.setItem("conversas", JSON.stringify(todasConversas));
    }

    function getConversations(idRemetente, idDestinatario) {
        const chatId = getChatId(idRemetente, idDestinatario);
        const todasConversas = JSON.parse(localStorage.getItem("conversas") || "{}");
        const msgs = todasConversas[chatId] || [];

        const seen = new Set();
        return msgs.filter((m) => {
            if (seen.has(String(m.id))) return false;
            seen.add(String(m.id));
            return true;
        });
    }

    return {
        getChatId,
        salvarMensagem,
        getConversations
    };
}
