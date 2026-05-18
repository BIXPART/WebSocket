"use client";

import { useRouter } from "next/navigation";
import whatszap2 from "../assets/whatszap2.png";

import styles from "./css/Headler.module.css";
import { useEffect, useState } from "react";

export default function Headler({ onLogout }) {
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
        <button
          className={styles.homeButtonWrapper}
          onClick={() => router.push("/")}
        >
          <img src={whatszap2.src} alt="Home" className={styles.homeLogo} />
        </button>
        <button
          className={`${styles.button} ${styles.logoutButton}`}
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              localStorage.removeItem("token");
              router.push("/login");
            }
          }}
        >
          Logout
        </button>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <button
        className={styles.homeButtonWrapper}
        onClick={() => router.push("/")}
      >
        <img src={whatszap2.src} alt="Home" className={styles.homeLogo} />
      </button>
      <button className={styles.button} onClick={() => router.push("/login")}>
        Login
      </button>
      <button
        className={styles.button}
        onClick={() => router.push("/cadastro")}
      >
        Register
      </button>
    </header>
  );
}
