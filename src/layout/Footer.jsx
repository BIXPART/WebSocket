"use client";

import styles from "./css/Footer.module.css";
import UsuariosIniciais from "@/hooks/UsuariosIniciais";

export default function Footer() {

  function limparLocalStorage(){
    localStorage.clear();
    UsuariosIniciais();
  }

  return (
    <div className={styles.footerWrapper}>
      <footer className={styles.footer}>
        <p className={styles.text}>© 2026 Company. Todos os direitos reservados.</p>
        <button onClick={()=>{localStorage.clear()}}>limpar</button>
      </footer>
    </div>
  );
}
