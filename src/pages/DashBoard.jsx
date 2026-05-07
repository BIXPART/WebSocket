"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Headler from "@/layout/Headler";
import Footer from "@/layout/Footer";

export default function DashBoard() {

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("token")) {
      setHasToken(true);
    }

    const user = JSON.parse(localStorage.getItem("token"));

    if (user == null) {
      router.push("/");
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
