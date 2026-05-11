"use client";

import { useRouter } from "next/navigation";
import whatszap2 from '../assets/whatszap2.png';

import styles from "./css/Headler.module.css";
import { useEffect, useState } from "react";

function logout(router){
    localStorage.removeItem("token");
    router.push("/Login");
}

export default function Headler() {
  
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("token")) {
      setHasToken(true);
    }
  }, []);

  if (!mounted) return <header className={styles.header}></header>;

  if (hasToken) {
    return (
      <header className={styles.header}>
        <button className={styles.homeButtonWrapper} onClick={() => router.push("/")}>
          <img src={whatszap2.src} alt="Home" className={styles.homeLogo} />
        </button>
        <button className={`${styles.button} ${styles.logoutButton}`} onClick={() => {
            localStorage.removeItem("token");
            setHasToken(false);
            router.push("/Login");
        }}>Logout</button>
      </header>
    );
  } else {
    return (
      <header className={styles.header}>
        <button className={styles.homeButtonWrapper} onClick={() => router.push("/")}>
          <img src={whatszap2.src} alt="Home" className={styles.homeLogo} />
        </button>
        <button className={styles.button} onClick={() => router.push("/Login")}>Login</button>
        <button className={styles.button} onClick={() => router.push("/Cadastro")}>Register</button>
      </header>
    );
  }
}
