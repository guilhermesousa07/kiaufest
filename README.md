# KIAU FEST — Neon Edition

Plataforma inicial de eventos com:
- Site público e identidade visual neon.
- Cadastro e login de clientes.
- Painel administrativo protegido.
- Cadastro, edição e cancelamento de eventos.
- Cadastro de setores e capacidade.
- Criação de pedidos com status `pending`.
- Ambiente 3D demonstrativo com Three.js.
- Upload de modelos de espaço `.glb` e `.gltf`.

## Requisitos
- Node.js 20 ou superior
- MySQL 8
- Navegador atualizado com WebGL

## Instalação no Windows

1. Extraia o ZIP.
2. Abra a pasta `kiau-fest-neon` no VS Code.
3. No terminal, execute:

```bash
npm install
```

4. Crie o banco executando o arquivo `database/schema.sql` no MySQL Workbench ou phpMyAdmin.
5. Copie `.env.example` para `.env`.
6. Edite o `.env` com os dados do seu MySQL. Troque obrigatoriamente `SESSION_SECRET` e `ADMIN_PASSWORD`.
7. Inicie:

```bash
npm run dev
```

8. Acesse:
- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

O administrador inicial é criado automaticamente com `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env`.

## Logo global
Substitua `public/assets/logo.png` pela sua imagem PNG, mantendo exatamente o mesmo nome. O site usa esse caminho no cabeçalho, rodapé e painel.

## Mapa 3D
A página inicial contém um espaço demonstrativo criado em Three.js. O visitante pode girar, aproximar, selecionar setores e alternar a vista superior.
No painel, a área "Modelos 3D" aceita upload de `.glb` ou `.gltf`. Para um GLTF com texturas/arquivos externos, prefira exportar como GLB.
A etapa seguinte é ligar o modelo enviado à visualização pública do evento e construir o editor visual de layout.

## Observações importantes
- O pedido criado fica com status `pending`; não existe cobrança real nesta versão.
- Não publique o sistema na internet sem HTTPS, revisão de segurança, política de privacidade, backups e integração de pagamento adequada.
- O mapa 3D usa Three.js via CDN; é necessária conexão com a internet para carregar a biblioteca.
- Use apenas imagens, modelos 3D e marcas que você tenha direito de utilizar.
