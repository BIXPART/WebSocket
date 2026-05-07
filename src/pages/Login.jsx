"use client";

import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";
import { useState } from "react";
import { useRouter } from "next/router";

import styles from "./css/Login.module.css";

export default function Login(){

    const router = useRouter();

    const [CampEmail,setCampEmail] = useState("");
    const [CampSenha,setCampSenha] = useState("");
    const [VerSenha,setVerSenha] = useState(false);

    function doLogin(){
        const usuarios = JSON.parse(localStorage.getItem("usuarios") || []);
        const usuario = usuarios.find((u) => u.email === CampEmail && u.senha === CampSenha || u.nome === CampEmail && u.senha === CampSenha);
        if(usuario){
            localStorage.setItem("token", JSON.stringify(usuario));
            return true;
        }
        return false;
    }

    return(
        <div className={styles.page}>
            <Headler />
            <main className={styles.main}>
                <div className={styles.formContainer}>
                    <h1 className={styles.title}>Login</h1>
                    
                    <div className={styles.inputGroup}>
                        <input className={styles.input} type="text" placeholder="Email" value={CampEmail} onChange={(e) => setCampEmail(e.target.value)} />
                    </div>

                    <div className={styles.inputGroup}>
                        <input className={styles.input} type={VerSenha ? "text" : "password"} placeholder="Senha" value={CampSenha} onChange={(e) => setCampSenha(e.target.value)} />
                        <button className={styles.togglePassword} onClick={() => setVerSenha(!VerSenha)}>{VerSenha ? "Ocultar" : "Mostrar"}</button>
                    </div>

                    <button className={styles.button} onClick={() => doLogin() ? router.push("/Home") : alert("email || senha invalidos")}>Login</button>
                </div>
            </main>
            <Footer />
        </div>
    );
}