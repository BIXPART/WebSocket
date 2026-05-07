import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Cadastro() {

    const router = useRouter();

    const [CampNome,setCampNome] = useState("");
    const [CampEmail,setCampEmail] = useState("");
    const [CampSenha,setCampSenha] = useState("");

    function Cadastrar() {
        const usuarios = JSON.parse(localStorage.getItem("usuarios"));
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
        <>
        <Headler />
        <h1>Cadastro</h1>
        <input type="text" placeholder="Nome" value={CampNome} onChange={(e) => setCampNome(e.target.value)} />
        <input type="text" placeholder="Email" value={CampEmail} onChange={(e) => setCampEmail(e.target.value)} />
        <input type="password" placeholder="Senha" value={CampSenha} onChange={(e) => setCampSenha(e.target.value)} />
        <button onClick={() => Cadastrar() ? router.push("/") : alert("usuario  || email ja cadastrado")}>Cadastrar</button>

        <Footer />
        </>
    )
}