"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";

export default function DashBoard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [contatosUser, setContatosUser] = useState([]);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("token")) {
      setHasToken(true);
    }

    const tokenStr = localStorage.getItem("token");
    if (!tokenStr) {
      router.push("/");
      return;
    }

    const user = JSON.parse(tokenStr);

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const filtered = usuarios.filter((c) => {
      const userContatos = user.contatos || [];
      return userContatos.includes(c.id);
    });
    setContatosUser(filtered);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Headler />
      <h1>Dashboard</h1>
      {contatosUser.map((contato) => (
        <div key={contato.id}>
          <button>{contato.nome}</button>
          <p>{contato.email}</p>
        </div>
      ))}
      <Footer />
    </>
  );
}
