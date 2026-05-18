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

        todasConversas[chatId].push({
            id: id || Date.now() + "_" + Math.random(),
            enviadoPor: String(idRemetente),
            texto: texto,
            data: data || new Date().toISOString(),
        });

        localStorage.setItem("conversas", JSON.stringify(todasConversas));
    }

    function getConversations(idRemetente, idDestinatario) {
        const chatId = getChatId(idRemetente, idDestinatario);
        const todasConversas = JSON.parse(localStorage.getItem("conversas") || "{}");
        return todasConversas[chatId] || [];
    }

    return {
        getChatId,
        salvarMensagem,
        getConversations
    };
}
