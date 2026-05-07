"use client";

import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";
import { useState } from "react";
import { useRouter } from "next/router";

import styles from "./css/Cadastro.module.css";

export default function Cadastro() {

    const router = useRouter();

    const [CampNome,setCampNome] = useState("");
    const [CampEmail,setCampEmail] = useState("");
    const [CampSenha,setCampSenha] = useState("");

    function Cadastrar() {
        const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
        const usuario = {
            id: usuarios.length + 1,
            nome: CampNome,
            email: CampEmail,
            senha: CampSenha,
            contatos: []
        };
        usuarios.push(usuario);
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
        localStorage.setItem("token", JSON.stringify(usuario));
        return true;
    }

    return(
        <div className={styles.page}>
            <Headler />
            <main className={styles.main}>
                <div className={styles.formContainer}>
                    <h1 className={styles.title}>Cadastro</h1>
                    <input className={styles.input} type="text" placeholder="Nome" value={CampNome} onChange={(e) => setCampNome(e.target.value)} />
                    <input className={styles.input} type="text" placeholder="Email" value={CampEmail} onChange={(e) => setCampEmail(e.target.value)} />
                    <input className={styles.input} type="password" placeholder="Senha" value={CampSenha} onChange={(e) => setCampSenha(e.target.value)} />
                    <button className={styles.button} onClick={() => Cadastrar() ? router.push("/") : alert("usuario  || email ja cadastrado")}>Cadastrar</button>
                </div>
            </main>
            <Footer />
        </div>
    )
}