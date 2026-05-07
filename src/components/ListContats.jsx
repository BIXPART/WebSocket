"use client";

import { useState } from "react";

export default function ListContats() {

try{
    const token = localStorage.getItem("token");
    const user = jwt.decode(token);
    const [contatos,setContatos] = useState(user.contatos);
}catch(e) {
    console.log(e);
    return <Navigate to="/" />;
}

  return (
    <div className="list_contats">
      <ul>
        {contatos.map((contato) => (
          <button key={contato.id}>{contato.nome}</button>
        ))}
      </ul>
    </div>
  );
}