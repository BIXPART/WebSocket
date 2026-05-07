export default function UsuariosIniciais(){
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
      ]));
}