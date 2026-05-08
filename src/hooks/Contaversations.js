export default function Conversations() {

    function getChatId(id1, id2) {
        return [id1, id2].sort((a, b) => a - b).join("_");
    }

    function salvarMensagem(idRemetente, idDestinatario, texto) {
        const chatId = getChatId(idRemetente, idDestinatario);

        // 1. Pega o que já existe ou cria um objeto vazio
        const todasConversas = JSON.parse(localStorage.getItem("conversas") || "{}");

        // 2. Se a conversa específica não existir, cria o array dela
        if (!todasConversas[chatId]) {
            todasConversas[chatId] = [];
        }

        // 3. Adiciona a nova mensagem
        todasConversas[chatId].push({
            enviadoPor: idRemetente,
            texto: texto,
            data: new Date().toISOString()
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
