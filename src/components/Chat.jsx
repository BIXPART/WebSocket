import { useEffect, useState, useRef } from "react";
import Conversations from "@/hooks/Contaversations";
import styles from "./css/Chat.module.css";

export default function Chat(){

    const [mensagens, setMensagens] = useState([]);
    const [inputMensagem, setInputMensagem] = useState("");
    const { getConversations, salvarMensagem } = Conversations();
    const messagesEndRef = useRef(null);

    const meuId = localStorage.getItem("id");
    const idContato = localStorage.getItem("id_contato");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        async function get(){
            const msgs = getConversations(meuId, idContato);
            setMensagens(msgs);
        }
        get();
    }, [meuId, idContato, getConversations]);

    useEffect(() => {
        scrollToBottom();
    }, [mensagens]);

    function enviaMensagem(e){
        if (e) e.preventDefault();
        if (!inputMensagem.trim()) return;
        
        salvarMensagem(meuId, idContato, inputMensagem);
        
        // Update local state so it shows immediately
        const msgs = getConversations(meuId, idContato);
        setMensagens(msgs);
        
        setInputMensagem("");
    }

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <div className={styles.chatHeaderInfo}>
                    {/* Placeholder avatar if we don't have contact details here */}
                    <div className={styles.avatar}>C</div>
                    <span className={styles.contactName}>Contato {idContato}</span>
                </div>
            </div>

            <div className={styles.messagesArea}>
                {mensagens.map((mensagem, index) => {
                    const isMine = mensagem.enviadoPor === meuId;
                    return (
                        <div 
                            key={index} 
                            className={`${styles.messageRow} ${isMine ? styles.messageRowSent : styles.messageRowReceived}`}
                        >
                            <div className={`${styles.messageBubble} ${isMine ? styles.messageSent : styles.messageReceived}`}>
                                {mensagem.texto}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={enviaMensagem}>
                <input 
                    type="text" 
                    className={styles.inputField}
                    value={inputMensagem} 
                    onChange={(e) => setInputMensagem(e.target.value)} 
                    placeholder="Digite uma mensagem" 
                />
                <button 
                    type="submit" 
                    className={styles.sendButton}
                    disabled={!inputMensagem.trim()}
                >
                    <svg className={styles.sendIcon} viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </form>
        </div>
    );
}