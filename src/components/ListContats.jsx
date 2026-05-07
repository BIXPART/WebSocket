"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./css/ListContats.module.css";

export default function ListContats() {
    const router = useRouter();
    const [contatos, setContatos] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const tokenStr = localStorage.getItem("token");
        const usuariosStr = localStorage.getItem("usuarios");
        if (tokenStr && usuariosStr) {
            const token = JSON.parse(tokenStr);
            const usuarios = JSON.parse(usuariosStr);
            setContatos(usuarios.filter((contato) => contato.id != token.id));
        }
    }, []);

    // Função para pegar uma cor baseada no ID para o avatar
    const getColorClass = (id) => {
        const colors = [styles.color1, styles.color2, styles.color3, styles.color4, styles.color5];
        return colors[id % colors.length];
    };

    if (!mounted) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                Conversas
            </div>
            <ul className={styles.list}>
                {contatos.map((contato) => (
                    <li key={contato.id}>
                        <button className={styles.contactItem} onClick={() => alert("Chat com " + contato.nome)}>
                            <div className={`${styles.avatar} ${getColorClass(contato.id)}`}>
                                {contato.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.contactInfo}>
                                <div className={styles.topLine}>
                                    <span className={styles.contactName}>{contato.nome}</span>
                                    <span className={styles.time}>12:00</span>
                                </div>
                                <div className={styles.bottomLine}>
                                    <span className={styles.contactStatus}>Toque para conversar</span>
                                </div>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}