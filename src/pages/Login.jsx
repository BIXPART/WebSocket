"use client";

import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Login(){

    const router = useRouter();

    const [CampEmail,setCampEmail] = useState("");
    const [CampSenha,setCampSenha] = useState("");
    const [VerSenha,setVerSenha] = useState(false);

    function Login(){
        const usuarios = JSON.parse(localStorage.getItem("usuarios"));
        const usuario = usuarios.find((usuario) => usuario.email === CampEmail && usuario.senha === CampSenha);
        if(usuario){
            localStorage.setItem("token", JSON.stringify(usuario));
            return true;
        }
        return false;
    }

    return(
        <>
        <Headler />
        <h1>Login</h1>
        <input type="text" placeholder="Email" value={CampEmail} onChange={(e) => setCampEmail(e.target.value)} />
        <input type={VerSenha ? "text" : "password"} placeholder="Senha" value={CampSenha} onChange={(e) => setCampSenha(e.target.value)} />
        <button onClick={() => setVerSenha(!VerSenha)}>{VerSenha ? "Ocultar" : "Mostrar"}</button>
        <button onClick={() => Login() ? router.push("/Home") : alert("email || senha invalidos")}>Login</button>
        <Footer />
        </>
    );
}