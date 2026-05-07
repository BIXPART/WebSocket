"use client";

import { useRouter } from "next/router";

export default function Headler() {
  
  const router = useRouter();

  if (localStorage.getItem("token")) {
    return (
      <div>
        <button onClick={() => router.push("/Home")}>Home</button>
        <button onClick={() => router.push("/Logout")}>Logout</button>
      </div>
    );
  } else {
    return (
      <header>
        <button onClick={() => router.push("/Home")}>Home</button>
        <button onClick={() => router.push("/Login")}>Login</button>
        <button onClick={() => router.push("/Cadastro")}>Register</button>
      </header>
    );
  }
}
