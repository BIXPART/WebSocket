"use client";

import styles from "./css/Footer.module.css";
import UsuariosIniciais from "@/hooks/UsuariosIniciais";
import { useState } from "react";

export default function Footer() {
  const [msg, setMsg] = useState("");

  function limparLocalStorage() {
    localStorage.clear();
    UsuariosIniciais();
    setMsg("Dados restaurados!");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className={styles.footerWrapper}>
      <footer className={styles.footer}>
        <p className={styles.text}>© 2026 Whatszap2 Cyber. Todos os direitos reservados.</p>
        <button className={styles.clearButton} onClick={limparLocalStorage}>
          limpar dados
        </button>
        {msg && <span className={styles.toast}>{msg}</span>}
      </footer>
    </div>
  );
}
