"use client";

import Headler from "@/layout/Headler";
import ListContats from "@/components/ListContats";
import Footer from "@/layout/Footer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UsuariosIniciais from "@/hooks/UsuariosIniciais";
import Chat from "@/components/Chat";
import whatszap2 from '../assets/whatszap2.png'

import styles from "./css/Home.module.css";

export default function Home() {

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("token")) {
      setHasToken(true);
    }
    if(!localStorage.getItem("usuarios")){
      UsuariosIniciais();
    }
  }, []);

  if (!mounted) return null;

  if (hasToken) {
    return (
      <div className={styles.page}>
        <Headler />
        <main className={styles.chatMain}>
          <ListContats />
          <div className={styles.chatPlaceholder}>
            <Chat />
          </div>
        </main>
        <Footer />
      </div>
    );
  } else {
    return (
      <div className={styles.page}>
        <Headler />
        <main className={styles.main}>
          <img src={whatszap2.src} alt="Whatszap Logo" className={styles.logo} />

          <h2 className={styles.subtitle}>Já tem uma conta? entre</h2>
          <button className={styles.button} onClick={() => router.push("/Login")}>Login</button>

          <h2 className={styles.subtitle}>Não tem uma conta? cadastre-se</h2>
          <button className={styles.button} onClick={() => router.push("/Cadastro")}>Cadastrar</button>
        </main>
        <Footer />
      </div>
    );
  }
}
