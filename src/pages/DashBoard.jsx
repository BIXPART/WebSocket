"use client";

import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";

export default function DashBoard() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("token"));

    if (user == null) {
      return <Navigate to="/" />;
    }

    const contatos = JSON.parse(localStorage.getItem("usuarios"));
    const contatosUser = contatos.filter((contato) => contato.id == user.id);
  }, []);

  return (
    <>
      <Headler />
      <h1>DashBoard</h1>
      {contatosUser.map((contato) => (
        <>
          <button>{contato.nome}</button>
          <p>{contato.email}</p>
        </>
      ))}

      <Footer />
    </>
  );
}
