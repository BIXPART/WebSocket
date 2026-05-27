# Whatszap2 Cyber

Aplicação de chat com estilo cyberpunk inspirada no WhatsApp, com suporte a mensagens privadas, chat global e salas temáticas.

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 16, React 19, CSS Modules |
| **Backend** | Node.js + `ws` (WebSocket nativo) |
| **Persistência** | localStorage (navegador) |

## Como iniciar

### 1. Backend (servidor WebSocket)

```bash
cd BackEnd
npm install
npm start
```

O servidor WebSocket será iniciado em `ws://localhost:3030`.

### 2. Frontend (interface Next.js)

```bash
cd FrontEnd
npm install
npm run dev
```

O frontend será iniciado em `http://localhost:3000`.

> A URL do WebSocket pode ser configurada via variável de ambiente `NEXT_PUBLIC_WS_URL` (padrão: `ws://localhost:3030`).

## Funcionalidades

### Registro / Login
- Criação de conta com nome, email e senha
- Login por email ou nome de usuário
- Sessão persistente via `localStorage`

### Gerenciamento de Contatos
- Adicionar contatos pelo **nome do usuário** com busca em tempo real
- Modal de busca que filtra usuários disponíveis enquanto digita
- Ao adicionar, a lista de contatos é atualizada para **ambas as partes** (quem adicionou e quem foi adicionado)
- Remoção de contatos não implementada (gerenciamento local)

### Chat Privado (Conversas)
- Mensagens privadas 1-on-1 com persistência local
- Indicador de "digitando..."
- Confirmação de entrega (check duplo)
- Histórico salvo no `localStorage`

### Chat Global
- Sala aberta onde **todos os usuários conectados** veem as mensagens
- Lista lateral de usuários online com botão para adicionar como contato
- Atualização em tempo real de entrada/saída

### Salas (Sistema de Salas)
- Criar salas temáticas com nome personalizado
- Listagem de salas disponíveis com contagem de membros
- Entrar e sair de salas
- Mensagens enviadas para **todos os membros** da sala
- **Alternar entre modos:**
  - **"Para todos"**: mensagem visível para todos na sala
  - **"Selecionar"**: marque destinatários específicos para enviar mensagem privada
- Lista de membros online dentro da sala com atualização periódica

### Presença Online
- Indicador de status online/offline em todos os contatos
- Usuários offline recebem mensagens pendentes quando reconectam

## Como usar o site

1. **Acesse** `http://localhost:3000`
2. **Cadastre-se** clicando em "Cadastrar" ou faça **Login** se já tiver conta
3. Após autenticar, você verá três abas no topo:

| Aba | Função |
|-----|--------|
| **Conversas** | Lista de contatos e chat privado |
| **Chat Global** | Mensagens para todos os usuários online |
| **Salas** | Criação e participação em salas temáticas |

4. **Para conversar:**
   - Clique em um contato na lista para abrir chat privado
   - No Chat Global, digite e envie para todos verem
   - Em Salas, clique "Entrar" em uma sala e use os botões "Para todos" / "Selecionar" para escolher o modo de envio

## Padronização (Protocolo WebSocket)

Para que diferentes clientes possam se conectar ao servidor, todas as mensagens seguem o formato JSON padronizado abaixo.

### Mensagens Cliente → Servidor

```json
{ "type": "auth", "id": 1, "name": "Usuario" }
{ "type": "message", "to": 2, "text": "Ola" }
{ "type": "global_message", "text": "Ola todos" }
{ "type": "typing", "to": 2, "typing": true }
{ "type": "add_contact", "contactId": 3, "contactName": "Maria" }
{ "type": "search_users", "query": "mar" }
{ "type": "create_room", "name": "Amigos" }
{ "type": "join_room", "roomId": 1 }
{ "type": "leave_room", "roomId": 1 }
{ "type": "room_message", "roomId": 1, "text": "Ola sala" }
{ "type": "list_room_users", "roomId": 1 }
{ "type": "list_users" }
{ "type": "list_all_users" }
{ "type": "list_rooms" }
```

### Mensagens Servidor → Cliente

```json
{ "type": "auth_ok", "id": 1 }
{ "type": "message", "id": 1, "from": 1, "to": 2, "text": "Ola", "data": "2024-01-01T00:00:00.000Z" }
{ "type": "message", ..., "delivered": true }
{ "type": "global_message", "id": 1, "from": 1, "fromName": "Usuario", "text": "Ola", "data": "..." }
{ "type": "user_list", "users": [{ "id": 1, "name": "Usuario", "online": true }] }
{ "type": "all_users", "users": [{ "id": 1, "name": "Usuario" }] }
{ "type": "contact_added", "byUserId": 1, "byUserName": "Usuario" }
{ "type": "add_contact_confirm", "contactId": 3, "contactName": "Maria" }
{ "type": "search_users_result", "users": [{ "id": 1, "name": "Usuario" }] }
{ "type": "rooms_list", "rooms": [{ "id": 1, "name": "Amigos", "memberCount": 2, "createdBy": 1 }] }
{ "type": "room_created", "room": { "id": 1, "name": "Amigos", "memberCount": 1 } }
{ "type": "room_joined", "roomId": 1, "name": "Amigos" }
{ "type": "room_message", "id": 1, "roomId": 1, "from": 1, "fromName": "Usuario", "text": "Ola", "data": "..." }
{ "type": "room_users", "roomId": 1, "users": [{ "id": 1, "name": "Usuario", "online": true }] }
{ "type": "typing", "from": 1, "typing": true }
{ "type": "error", "message": "Sala não encontrada" }
```

### Fluxo de autenticação

1. Cliente conecta via WebSocket
2. Cliente envia `{ type: "auth", id: <userId>, name: "<nome>" }`
3. Servidor responde `{ type: "auth_ok", id: <userId> }`
4. Servidor envia lista de usuários online (`user_list`)
5. Servidor entrega mensagens pendentes (se houver)

## Estrutura do Projeto

```
WebSocket/
├── BackEnd/
│   ├── index.js           # Servidor WebSocket principal
│   └── package.json
├── FrontEnd/
│   ├── server/index.js    # Servidor alternativo (legado)
│   ├── src/
│   │   ├── app/           # Páginas Next.js
│   │   ├── components/    # Componentes de UI
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── layout/        # Header e Footer
│   │   └── views/         # Páginas da aplicação
│   └── package.json
└── README.md
```
