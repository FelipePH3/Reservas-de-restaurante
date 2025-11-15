  import express from "express";
  import bodyParser from "body-parser";
  import pg from "pg";
  import jwt from "jsonwebtoken";
  import bcrypt from "bcrypt";


  const app = express();
  const port = 3000;

  app.use(bodyParser.json());

  const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Seu database",
    password: "sua senha",
    port: 5432,//mude a porta caso tenha escolhido outra
  });

  db.connect()
    .then(() => console.log("✅ Conectado ao PostgreSQL"))
    .catch((err) => console.error("❌ Erro ao conectar ao banco:", err));

  function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, "chave_secreta_super_segura", (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

function apenasAdmin(req, res, next) {
  if (req.user.role !== "administrador") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar essa ação." });
  }

  next(); 
}


app.post("/usuarios/register", async (req, res) => {


    try {
      const { nome, senha, email, role } = req.body;

      if (!nome || !email || !senha || !role) {
        return res.status(400).json({ error: "Preencha todos os campos." });
      }

      const checarUsuario = await db.query(
        "SELECT * FROM usuarios WHERE email = $1",
        [email]
      );

      if (checarUsuario.rows.length > 0) {
        return res.status(400).json({ error: "Email já cadastrado." });
      }

      const senhaCriptografada = await bcrypt.hash(senha, 10);

      const novoUsuario = await db.query(
        "INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING *",
        [nome, email, senhaCriptografada, role]
      );

      res.status(201).json({
        message: "Usuário registrado com sucesso!",
        user: novoUsuario.rows[0],
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

app.post("/usuarios/login", async (req, res) => {
    try {
      const { email, senha } = req.body;

      
      const result = await db.query("SELECT * FROM usuarios WHERE email = $1", [email]);

      if (result.rows.length === 0) {
        return res.status(400).json({ error: "Email ou senha incorretos" });
      }

      const usuario = result.rows[0];

     
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.status(400).json({ error: "Email ou senha incorretos" });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          email: usuario.email,
          role: usuario.role,
        },
        "chave_secreta_super_segura", 
        { expiresIn: "1h" } 
      );

      res.json({
        message: "Login bem-sucedido!",
        token: token,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno no login" });
    }
  });


app.get("/usuarios/me", autenticarToken, async (req, res) => {
    try {

      const { id } = req.user;

      const result = await db.query("SELECT id, nome, email, role FROM usuarios WHERE id = $1", [id]);

      res.json({ usuario: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  });

app.post("/usuarios/me/listagem",autenticarToken, async (req,res) => {
    try { 
    const listarTodas = await db.query("SELECT * FROM mesas ")
    res.json(listarTodas.rows) 
      }
    catch (err){
       res.status(500).json({ erro: "Erro ao buscar mesas" });
    }
  })

app.post("/usuarios/me/listagem/reservar", autenticarToken, async (req, res) => { 
  try {
    const { nomeMesa } = req.body;
    const usuarioID = req.user.id;

    if (!nomeMesa) {  
      return res.status(400).json({ error: "Informe o nome da mesa." });
    }

    const mesa = await db.query(
      "SELECT * FROM mesas WHERE nome = $1",
      [nomeMesa]
    );

    if (mesa.rows.length === 0) {
      return res.status(404).json({ error: "Mesa não encontrada." });
    }

    const mesaId = mesa.rows[0].id;


    if (mesa.rows[0].status !== "disponível") {
      return res.status(400).json({ error: "Mesa não está disponível." });
    }

    const reserva = await db.query(
      "INSERT INTO reservas (usuario_id, mesa_id, status) VALUES ($1, $2, $3) RETURNING *",
      [usuarioID, mesaId, "ativo"]
    );


    await db.query(
      "UPDATE mesas SET status = 'reservada' WHERE id = $1",
      [mesaId]
    );

  
    res.json({
      message: "Mesa reservada com sucesso!",
      reserva: reserva.rows[0],
    });

  } catch (error) { 
    console.error(error);
    res.status(500).json({ error: "Erro ao reservar mesa." });
  }
});

app.post("/usuarios/me/listagem/reservar/criar", autenticarToken, apenasAdmin, async (req, res) => {  
  try {
    const { nome, capacidade } = req.body;

    if (!nome || !capacidade) {
      return res.status(400).json({ error: "Preencha nome e capacidade." });
    }

    const listarMesas = await db.query(
      "SELECT * FROM mesas WHERE nome = $1",
      [nome]
    );

    if (listarMesas.rows.length > 0) {
      return res.status(400).json({ error: "MESA JÁ EXISTENTE" });
    }

    const criarMesa = await db.query(
      "INSERT INTO mesas (nome, capacidade, status) VALUES ($1, $2, $3) RETURNING *",
      [nome, capacidade, "disponível"]
    );

    res.status(201).json({
      message: "Mesa criada com sucesso!",
      mesa: criarMesa.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno ao criar mesa." });
  }
});

app.post("/usuarios/me/listagem/reservar/cancelar", autenticarToken, apenasAdmin, async (req, res) => {
  try {
    const {nome} = req.body

    if (!nome ) {
      return res.status(400).json({ error: "Preencha nome ." });
    }
     const listarMesas = await db.query(
      "SELECT * FROM mesas WHERE nome = $1",
      [nome]
    );

    if(listarMesas.rows.length === 0){
      return res.status(404).json({ error: "Mesa não encontrada." });
    }

    const mesaId = listarMesas.rows[0].id

    await db.query(" UPDATE mesas SET status = 'inativa' WHERE id = $1", [mesaId])
  await db.query("DELETE FROM reservas WHERE mesa_id = $1" , [mesaId])


     res.json({
      message: "Mesa cancelada  com sucesso!",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao cancelar mesa." });
  }

})

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
