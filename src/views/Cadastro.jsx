"use client";

import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";
import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./css/Cadastro.module.css";

export default function Cadastro() {
  const router = useRouter();

  const [CampNome, setCampNome] = useState("");
  const [CampEmail, setCampEmail] = useState("");
  const [CampSenha, setCampSenha] = useState("");

  function Cadastrar() {
    if (!CampNome.trim() || !CampEmail.trim() || !CampSenha.trim()) {
      alert("Preencha todos os campos");
      return false;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");

    if (usuarios.some((u) => u.email === CampEmail)) {
      alert("Email já cadastrado");
      return false;
    }

    const maxId = usuarios.reduce((max, u) => Math.max(max, u.id), 0);
    const usuario = {
      id: maxId + 1,
      nome: CampNome.trim(),
      email: CampEmail.trim(),
      senha: CampSenha,
      contatos: [],
    };
    usuarios.push(usuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    localStorage.setItem("token", JSON.stringify(usuario));
    return true;
  }

  return (
    <div className={styles.page}>
      <Headler />
      <main className={styles.main}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Cadastro</h1>
          <input
            className={styles.input}
            type="text"
            placeholder="Nome"
            value={CampNome}
            onChange={(e) => setCampNome(e.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Email"
            value={CampEmail}
            onChange={(e) => setCampEmail(e.target.value)}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Senha"
            value={CampSenha}
            onChange={(e) => setCampSenha(e.target.value)}
          />
          <button
            className={styles.button}
            onClick={() => (Cadastrar() ? router.push("/") : null)}
          >
            Cadastrar
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
