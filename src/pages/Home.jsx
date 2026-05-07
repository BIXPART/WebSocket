"use client";

import Headler from "@/layout/Headler";
import ListContats from "@/components/ListContats";
import Footer from "@/layout/Footer";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {

  const router = useRouter();

  useEffect(() => {
    localStorage.setItem(
      "usuarios",
      JSON.stringify([
        {
          id: 1,
          nome: "Maximiliano",
          email: "[EMAIL_ADDRESS]",
          senha: "123",
          contatos: [2, 3],
        },
        {
          id: 2,
          nome: "Maria",
          email: "[EMAIL_ADDRESS]",
          senha: "123",
          contatos: [1],
        },
        {
          id: 3,
          nome: "Pedro",
          email: "[EMAIL_ADDRESS]",
          senha: "123",
          contatos: [1],
        },
      ]),
    );
  }, []);

  if (localStorage.getItem("token")) {
    return <ListContats />;
  } else {
    return (
      <>
        <div>
          <Headler />
          <h1>WebChat</h1>

          <h1>Já tem uma conta? entre</h1>
          <button onClick={() => router.push("/login")}>Login</button>

          <h1>Não tem uma conta? cadastre-se</h1>
          <button onClick={() => router.push("/cadastro")}>Cadastrar</button>

          <Footer />
        </div>
      </>
    );
  }
}
