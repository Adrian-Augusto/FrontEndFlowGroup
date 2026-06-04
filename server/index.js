/**
 * Mock API — rotas /api/v1/auth alinhadas ao backend Nest
 */
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { orderGroups, validatePagination } from "./utils/groupOrdering.js";

const PORT = Number(process.env.PORT) || 8080;
const SERVER_ORIGIN = process.env.SERVER_ORIGIN || `http://localhost:${Number(process.env.PORT) || 8080}`;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Suporte a múltiplos origins separados por vírgula
const allowedOrigins = CLIENT_ORIGIN.split(",").map(origin => origin.trim());

// Setup para __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta para uploads - salvar em public/uploads/groups (relativo ao servidor)
const uploadsDir = path.resolve(__dirname, "public", "uploads", "groups");
console.log("[SERVER] Uploads directory:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("[SERVER] Uploads directory created");
}

// Mock storage para grupos
const mockGroups = [];

const sessions = new Map();
const userSubscriptions = new Map();
const app = express();

app.use(cors({ 
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: mobile apps, curl)
    if (!origin) return callback(null, true);
    
    // Verificar se origin está na lista de allowedOrigins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(cookieParser());

// Servir arquivos estáticos - /uploads aponta para server/public/uploads
app.use("/uploads", express.static(path.resolve(__dirname, "public", "uploads")));

// Configurar multer para upload de arquivos (máximo 5MB)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      console.log("[MULTER] Destination called, saving to:", uploadsDir);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log("[MULTER] Created directory:", uploadsDir);
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = crypto.randomUUID();
      const filename = `${name}${ext}`;
      console.log("[MULTER] Filename generated:", filename);
      cb(null, filename);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    console.log("[MULTER] File filter - checking mime type:", file.mimetype);
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas imagens são permitidas"));
    }
    cb(null, true);
  },
});

// Rotas de upload ANTES de express.json()
app.post("/api/v1/upload/group-photo", upload.single("photo"), (req, res) => {
  console.log("\n[SERVER] ===== UPLOAD ENDPOINT CALLED =====");
  console.log("[SERVER] Has file:", !!req.file);
  console.log("[SERVER] Request body:", Object.keys(req.body || {}));
  
  if (req.file) {
    console.log("[SERVER] File info:", {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
    });
  }

  if (!req.file) {
    console.error("[SERVER] ❌ Nenhum arquivo recebido");
    return res.status(400).json({ message: "Nenhum arquivo enviado" });
  }

  try {
    // Verificar se arquivo foi realmente salvo
    const filePath = req.file.path;
    const fileExists = fs.existsSync(filePath);
    console.log(`[SERVER] File exists at ${filePath}:`, fileExists);
    
    const photoUrl = `/uploads/groups/${req.file.filename}`;
    const fullUrl = `${SERVER_ORIGIN}${photoUrl}`;
    
    console.log("[SERVER] ✅ Upload bem-sucedido", { photoUrl, fullUrl, fileExists });
    
    res.json({
      success: true,
      message: "Foto enviada com sucesso",
      photoUrl,
      fullUrl,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error("[SERVER] ❌ Erro ao processar upload:", err);
    res.status(500).json({ message: "Erro ao processar foto" });
  }
});

// Middleware json APÓS rotas de upload
app.use(express.json());

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // true em prod (HTTPS), false em dev
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // none p/ cross-site em prod
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function getUser(req) {
  let sid = req.cookies?.access_token;

  // Suporte a Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!sid && authHeader && authHeader.startsWith("Bearer ")) {
    sid = authHeader.substring(7).trim();
  }

  if (!sid) return null;

  // Se o sid é uma sessão ativa no servidor
  if (sessions.has(sid)) {
    return sessions.get(sid);
  }

  // Fallback: Decodificar JWT mock se não estiver nas sessões em memória
  try {
    const parts = sid.split(".");
    if (parts.length >= 2) {
      const payloadBuf = Buffer.from(parts[1], "base64");
      const payload = JSON.parse(payloadBuf.toString("utf-8"));
      if (payload && payload.email) {
        return {
          id: payload.sub || "mock-id",
          name: payload.name || "Usuário",
          email: payload.email,
          role: payload.role || "user",
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payload.email)}`,
        };
      }
    }
  } catch (err) {
    console.error("[SERVER] Erro ao decodificar token JWT:", err);
  }

  return null;
}

function createSession(res, user) {
  const sid = crypto.randomUUID();
  sessions.set(sid, user);
  res.cookie("access_token", sid, COOKIE_OPTS);
  return user;
}

function clearSession(req, res) {
  const sid = req.cookies?.access_token;
  if (sid) sessions.delete(sid);
  res.clearCookie("access_token", { path: "/" });
}

const mockUser = {
  id: "585d872a-d94f-4d25-8f1c-a7ac3119d26d",
  name: "Adrian Silva",
  email: "adriansilva7272@gmail.com",
  avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=adriansilva7272@gmail.com",
  profileImage: "https://api.dicebear.com/7.x/bottts/svg?seed=adriansilva7272@gmail.com",
  role: "admin",
};

function createMockJwt(user) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    })
  ).toString("base64");
  return `${header}.${payload}.`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/v1/auth/register", (req, res) => {
  const { name, email } = req.body ?? {};
  const user = {
    id: crypto.randomUUID(),
    name: name || "Novo usuário",
    email: email || "user@example.com",
    avatarUrl: null,
    role: "user",
  };
  createSession(res, user);
  res.json({ user });
});

app.post("/api/v1/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  
  // Validação mínima
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "Email é obrigatório" });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ message: "Senha é obrigatória" });
  }
  
  const normalizedEmail = email.trim().toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
  
  // Mock: qualquer password é válida. Em produção, hash com bcrypt.
  const user = {
    ...mockUser,
    email: normalizedEmail,
    role: isAdmin ? "admin" : "user",
  };
  
  const token = createMockJwt(user);
  createSession(res, user);
  res.json({ user, accessToken: token });
});

/** Inicia OAuth — mock redireciona direto ao callback do front */
app.get("/api/v1/auth/google", (req, res) => {
  const redirect =
    req.query.redirect ||
    `${CLIENT_ORIGIN}/auth/callback?next=${encodeURIComponent("/")}`;

  console.log("[AUTH] Google OAuth iniciado, redirect:", redirect);
  const user = { ...mockUser };
  createSession(res, user);
  console.log("[AUTH] Sessão criada para usuário:", user.email);

  const target = new URL(redirect);
  res.redirect(target.toString());
});

app.get("/api/v1/auth/google/callback", (req, res) => {
  const front = `${CLIENT_ORIGIN}/auth/callback?next=/`;
  if (!getUser(req)) createSession(res, mockUser);
  res.redirect(front);
});

const handleProfile = (req, res) => {
  console.log("[AUTH] /profile ou /users/me chamado, cookies:", req.cookies);
  const user = getUser(req);
  console.log("[AUTH] Usuário recuperado:", user ? user.email : "null");
  if (!user) return res.status(401).json({ message: "Não autenticado" });
  res.json({ user });
};

app.get("/api/v1/auth/google/profile", handleProfile);
app.get("/api/v1/users/me", handleProfile);

app.post("/api/v1/auth/logout", (req, res) => {
  clearSession(req, res);
  res.json({ ok: true });
});


// ===== ROTAS GROUPS =====

/** POST /api/v1/groups - Criar novo grupo */
app.post("/api/v1/groups", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { name, title, description, link, platform, photoUrl, category, sponsorThisGroup } = req.body;

  // Validações detalhadas
  const message = [];
  
  const finalTitle = title || name;
  if (!finalTitle || typeof finalTitle !== "string" || finalTitle.trim() === "") {
    message.push("title should not be empty");
  }
  
  if (!photoUrl || typeof photoUrl !== "string" || photoUrl.trim() === "") {
    message.push("photo should not be empty");
  }

  if (category === undefined || category === null || category === "") {
    message.push("category should not be empty");
    message.push("category must be a string");
  } else if (typeof category !== "string") {
    message.push("category must be a string");
  }
  
  if (message.length > 0) {
    return res.status(400).json({
      statusCode: 400,
      message,
      error: "Bad Request"
    });
  }

  // Calcular sponsorshipInfo ANTES de criar o grupo
  const userGroups = mockGroups.filter((g) => g.ownerId === user.id);
  const sponsoredGroups = userGroups.filter((g) => g.featured);
  const MAX_SPONSORED = 5;
  const canSponsor = sponsoredGroups.length < MAX_SPONSORED;

  // Determinar se o grupo será featured
  const isFeatured = sponsorThisGroup && canSponsor;

  // Criar novo grupo
  const newGroup = {
    id: crypto.randomUUID(),
    title: finalTitle,
    description: description || "",
    link: link || "",
    platform: platform || "outros",
    category: category,
    categoryId: category,
    photo: photoUrl,
    members: 0,
    status: "PENDING", // Novos grupos começam como pending
    featured: isFeatured,
    ownerId: user.id,
    createdAt: new Date().toISOString(),
    sponsoredUntil: isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  };

  const sponsorshipInfo = {
    canSponsor: !isFeatured && canSponsor, // Não pode mais patrocinar se este grupo foi patrocinado
    activeSponsoredCount: sponsoredGroups.length + (isFeatured ? 1 : 0),
    maxAllowed: MAX_SPONSORED,
  };

  console.log("[SERVER] Novo grupo criado:", {
    id: newGroup.id,
    title: newGroup.title,
    platform: newGroup.platform,
    photoUrl: photoUrl ? "✓" : "❌",
    featured: isFeatured,
    sponsorshipInfo,
  });

  mockGroups.push(newGroup);

  res.status(201).json({
    success: true,
    message: "Grupo criado com sucesso",
    data: {
      ...newGroup,
      sponsorshipInfo,
    },
  });

});

/** PATCH /api/v1/groups/:id - Atualizar grupo (dono) */
app.patch("/api/v1/groups/:id", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { id } = req.params;
  const group = mockGroups.find((g) => g.id === id);

  if (!group) {
    return res.status(404).json({ message: "Grupo não encontrado" });
  }

  if (group.ownerId !== user.id) {
    return res.status(403).json({ message: "Você não é o proprietário deste grupo" });
  }

  const { name, title, description, link, platform, photoUrl, category, categoryId } = req.body;

  const finalTitle = title || name;
  if (finalTitle !== undefined) {
    group.title = finalTitle;
  }
  if (description !== undefined) {
    group.description = description;
  }
  if (link !== undefined) {
    group.link = link;
  }
  if (platform !== undefined) {
    group.platform = platform;
  }
  if (photoUrl !== undefined) {
    group.photo = photoUrl;
  }
  
  const finalCategory = categoryId || category;
  if (finalCategory !== undefined) {
    group.category = finalCategory;
    group.categoryId = finalCategory;
  }

  console.log("[SERVER] PATCH /api/v1/groups/:id - grupo atualizado:", group.id, group.title);

  res.json({
    success: true,
    message: "Grupo atualizado com sucesso",
    data: group,
  });
});

/** DELETE /api/v1/groups/:id - Deletar grupo (dono) */
app.delete("/api/v1/groups/:id", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { id } = req.params;
  const index = mockGroups.findIndex((g) => g.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Grupo não encontrado" });
  }

  const group = mockGroups[index];
  if (group.ownerId !== user.id) {
    return res.status(403).json({ message: "Você não é o proprietário deste grupo" });
  }

  mockGroups.splice(index, 1);
  console.log("[SERVER] DELETE /api/v1/groups/:id - grupo deletado pelo dono:", id);

  res.status(204).end();
});

// ===== ROTAS GROUPS PÚBLICAS =====

/** GET /api/v1/groups/me - Meus grupos (criados pelo usuário logado) */
app.get("/api/v1/groups/me", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userGroups = mockGroups.filter((g) => g.ownerId === user.id);

  console.log("[SERVER] GET /api/v1/groups/me - userId:", user.id, "grupos encontrados:", userGroups.length);

  res.json({
    success: true,
    data: userGroups,
  });
});

/** GET /api/v1/subscriptions/limits - Obter limites de patrocínio do usuário */
app.get("/api/v1/subscriptions/limits", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const userGroups = mockGroups.filter((g) => g.ownerId === user.id);
  const sponsoredGroups = userGroups.filter((g) => g.featured);
  const MAX_SPONSORED = 5;
  const remaining = Math.max(0, MAX_SPONSORED - sponsoredGroups.length);

  console.log("[SERVER] GET /api/v1/subscriptions/limits - userId:", user.id, {
    activeSponsoredCount: sponsoredGroups.length,
    maxAllowed: MAX_SPONSORED,
    remaining,
    totalUserGroups: userGroups.length,
  });

  res.json({
    success: true,
    data: {
      canSponsor: sponsoredGroups.length < MAX_SPONSORED,
      sponsoredGroups: {
        active: sponsoredGroups.length,
        max: MAX_SPONSORED,
        remaining: remaining,
      },
    },
  });
});

/** POST /api/v1/groups/:id/feature - Patrocinar/destacar um grupo existente */
app.post("/api/v1/groups/:id/feature", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { id } = req.params;
  const group = mockGroups.find((g) => g.id === id);

  if (!group) {
    return res.status(404).json({ message: "Grupo não encontrado" });
  }

  if (group.ownerId !== user.id) {
    return res.status(403).json({ message: "Você não tem permissão para patrocinar este grupo" });
  }

  if (group.featured) {
    return res.status(400).json({ message: "Este grupo já está patrocinado" });
  }

  // Verificar limites de patrocínio
  const userGroups = mockGroups.filter((g) => g.ownerId === user.id);
  const sponsoredGroups = userGroups.filter((g) => g.featured);
  const MAX_SPONSORED = 5;

  if (sponsoredGroups.length >= MAX_SPONSORED) {
    return res.status(400).json({
      message: `Você atingiu o limite de ${MAX_SPONSORED} grupos patrocinados`,
    });
  }

  // Marcar grupo como featured
  group.featured = true;
  group.sponsoredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log("[SERVER] POST /api/v1/groups/:id/feature - groupId:", id, {
    userId: user.id,
    featured: true,
    sponsoredUntil: group.sponsoredUntil,
  });

  res.json({
    success: true,
    message: "Grupo patrocinado com sucesso",
    data: group,
  });
});

/** GET /api/v1/groups - Lista de grupos aprovados com ordenação inteligente (público) */
app.get("/api/v1/groups", (req, res) => {
  const { page, limit } = req.query;
  const { page: validPage, pageSize } = validatePagination(page, limit);

  console.log("[SERVER] GET /api/v1/groups - page:", validPage, "pageSize:", pageSize);

  const result = orderGroups(mockGroups, validPage, pageSize);

  console.log(
    "[SERVER] Retornando",
    result.groups.length,
    "grupos em página",
    validPage,
    "| Total:",
    result.total,
    "| Featured:",
    result.featuredCount,
    "| Free:",
    result.freeCount
  );

  res.json({
    success: true,
    data: result.groups,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      hasMore: result.hasMore,
    },
    stats: {
      featuredCount: result.featuredCount,
      freeCount: result.freeCount,
    },
  });
});

// ===== ROTAS ADMIN =====

/** GET /api/v1/admin/groups - Lista grupos com filtro opcional de status */
app.get("/api/v1/admin/groups", (req, res) => {
  const user = getUser(req);
  if (!user || user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const { status } = req.query;
  let filtered = mockGroups;
  
  if (status && typeof status === "string" && status.trim()) {
    const statusFilter = status.trim().toUpperCase();
    filtered = mockGroups.filter((g) => g.status === statusFilter);
  }

  res.json({ data: filtered });
});

/** GET /api/v1/admin/groups/stats - Estatísticas de grupos */
app.get("/api/v1/admin/groups/stats", (req, res) => {
  const user = getUser(req);
  if (!user || user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  res.json({
    data: {
      groups: {
        approved: mockGroups.filter((g) => g.status === "APPROVED").length,
        pending: mockGroups.filter((g) => g.status === "PENDING").length,
        rejected: mockGroups.filter((g) => g.status === "REJECTED").length,
      },
      totalUsers: 1250,
      activeUsers30d: 892,
      onlineUsers: 42, // Mock value - should be calculated from actual online users
      totalMembers: mockGroups.reduce((sum, g) => sum + (g.members || 0), 0),
    },
  });
});

/** GET /api/v1/admin/users/online - Obter número de usuários online */
app.get("/api/v1/admin/users/online", (req, res) => {
  const user = getUser(req);
  if (!user || user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  // Mock value - should be calculated from actual online users tracking
  const onlineUsersCount = 42;

  console.log("[SERVER] GET /api/v1/admin/users/online - onlineUsers:", onlineUsersCount);

  res.json({
    success: true,
    data: {
      onlineUsers: onlineUsersCount,
      threshold: "15 minutes",
      timestamp: new Date().toISOString(),
    },
  });
});

/** POST /api/v1/admin/groups/:id/approve */
app.patch("/api/v1/admin/groups/:id/approve", (req, res) => {
  const user = getUser(req);
  if (!user || user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const group = mockGroups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Grupo não encontrado" });
  }

  group.status = "APPROVED";
  res.json({ data: group });
});

/** PATCH /api/v1/admin/groups/:id/reject */
app.patch("/api/v1/admin/groups/:id/reject", (req, res) => {
  const user = getUser(req);
  if (!user || user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const { reason } = req.body || {};
  const group = mockGroups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Grupo não encontrado" });
  }

  group.status = "REJECTED";
  group.rejectReason = reason || "Não informado";
  res.json({ data: group });
});

/** DELETE /api/v1/admin/groups/:id */
app.delete("/api/v1/admin/groups/:id", (req, res) => {
  const user = getUser(req);
  if (!user || user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const index = mockGroups.findIndex((g) => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Grupo não encontrado" });
  }

  const deleted = mockGroups.splice(index, 1);
  res.json({ data: deleted[0], message: "Grupo deletado com sucesso" });
});

/** GET /api/v1/categories - Listar todas as categorias */
app.get("/api/v1/categories", (req, res) => {
  const categories = [
    { id: "livros-pdf", name: "Livros em PDF/ebook", section: "Educação & Aprendizado" },
    { id: "cursos", name: "Cursos", section: "Educação & Aprendizado" },
    { id: "educacao", name: "Educação", section: "Educação & Aprendizado" },
    { id: "animes", name: "Animes", section: "Entretenimento" },
    { id: "filmes-series", name: "Filmes e séries", section: "Entretenimento" },
    { id: "games", name: "Games", section: "Entretenimento" },
    { id: "apostas", name: "Apostas", section: "Entretenimento" },
    { id: "namoro", name: "Namoro", section: "Relacionamentos" },
    { id: "fazer-amigos", name: "Fazer amigos", section: "Relacionamentos" },
    { id: "fitness", name: "Fitness", section: "Lifestyle & Bem-estar" },
    { id: "animais", name: "Animais", section: "Lifestyle & Bem-estar" },
    { id: "renda-extra", name: "Renda extra", section: "Finanças" },
    { id: "investimentos", name: "Investimentos", section: "Finanças" },
    { id: "cupons", name: "Cupons de descontos em produtos", section: "Compras" },
    { id: "adultos-18", name: "Adultos 18+", section: "Conteúdo Adulto" },
  ];

  res.json({
    success: true,
    data: categories,
  });
});

/** GET /api/v1/categories/:id - Obter detalhes de uma categoria específica com seus grupos */
app.get("/api/v1/categories/:id", (req, res) => {
  const { id } = req.params;
  const categories = [
    { id: "livros-pdf", name: "Livros em PDF/ebook", section: "Educação & Aprendizado" },
    { id: "cursos", name: "Cursos", section: "Educação & Aprendizado" },
    { id: "educacao", name: "Educação", section: "Educação & Aprendizado" },
    { id: "animes", name: "Animes", section: "Entretenimento" },
    { id: "filmes-series", name: "Filmes e séries", section: "Entretenimento" },
    { id: "games", name: "Games", section: "Entretenimento" },
    { id: "apostas", name: "Apostas", section: "Entretenimento" },
    { id: "namoro", name: "Namoro", section: "Relacionamentos" },
    { id: "fazer-amigos", name: "Fazer amigos", section: "Relacionamentos" },
    { id: "fitness", name: "Fitness", section: "Lifestyle & Bem-estar" },
    { id: "animais", name: "Animais", section: "Lifestyle & Bem-estar" },
    { id: "renda-extra", name: "Renda extra", section: "Finanças" },
    { id: "investimentos", name: "Investimentos", section: "Finanças" },
    { id: "cupons", name: "Cupons de descontos em produtos", section: "Compras" },
    { id: "adultos-18", name: "Adultos 18+", section: "Conteúdo Adulto" },
  ];

  // Mapeamento bidirecional de IDs de categorias (front-end <-> back-end)
  const idMap = {
    "cat-ebook": "livros-pdf",
    "cat-courses": "cursos",
    "cat-education": "educacao",
    "cat-animes": "animes",
    "cat-series": "filmes-series",
    "cat-games": "games",
    "cat-betting": "apostas",
    "cat-dating": "namoro",
    "cat-friends": "fazer-amigos",
    "cat-fitness": "fitness",
    "cat-pets": "animais",
    "cat-sideincome": "renda-extra",
    "cat-investments": "investimentos",
    "cat-coupons": "cupons",
    "cat-adult18": "adultos-18",
    "livros-pdf": "livros-pdf",
    "cursos": "cursos",
    "educacao": "educacao",
    "animes": "animes",
    "filmes-series": "filmes-series",
    "games": "games",
    "apostas": "apostas",
    "namoro": "namoro",
    "fazer-amigos": "fazer-amigos",
    "fitness": "fitness",
    "animais": "animais",
    "renda-extra": "renda-extra",
    "investimentos": "investimentos",
    "cupons": "cupons",
    "adultos-18": "adultos-18",
  };

  const normalizedId = idMap[id.toLowerCase()] || id.toLowerCase();
  const category = categories.find((c) => c.id === normalizedId);

  if (!category) {
    return res.status(404).json({ message: "Categoria não encontrada" });
  }

  // Filtrar grupos que pertencem a essa categoria
  const groups = mockGroups.filter((g) => {
    if (!g.categoryId) return false;
    const gCatId = idMap[g.categoryId.toLowerCase()] || g.categoryId.toLowerCase();
    return gCatId === normalizedId && g.status?.toUpperCase() === "APPROVED";
  });

  res.json({
    success: true,
    data: {
      ...category,
      groups,
    },
  });
});

/** GET /api/v1/plans/me - Obter plano atual do usuário */
app.get("/api/v1/plans/me", (req, res) => {
  const user = getUser(req);
  
  // Se não autenticado, retorna vazio (sem plano)
  if (!user) {
    return res.json({ planId: null, expiresAt: null });
  }

  const sub = userSubscriptions.get(user.id);
  if (sub) {
    return res.json({
      planId: sub.planId,
      expiresAt: sub.expiresAt,
      startedAt: sub.startedAt,
      userId: user.id,
    });
  }

  res.json({
    planId: null,
    expiresAt: null,
    startedAt: null,
    userId: user.id,
  });
});

/** GET /api/v1/plans/active - Obter detalhes completos do plano ativo do usuário */
app.get("/api/v1/plans/active", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const sub = userSubscriptions.get(user.id);
  if (sub) {
    return res.json({
      success: true,
      data: {
        id: sub.planId,
        planId: sub.planId,
        expiresAt: sub.expiresAt,
        startedAt: sub.startedAt,
        userId: user.id,
        status: "active",
        planName: getPlanName(sub.planId),
        price: getPlanPrice(sub.planId),
      }
    });
  }

  res.json({
    success: true,
    data: null,
  });
});

/** GET /api/v1/plans - Listar todos os planos disponíveis */
app.get("/api/v1/plans", (req, res) => {
  res.json({
    data: [
      {
        id: "e1042858-a403-4524-90ef-46d5d7a3670c",
        name: "Teste - R$ 0,01",
        price: 0.01,
        duration: 1,
        type: "BASIC",
      },
      {
        id: "9c9fde4e-5115-46d4-b724-13aa9652520e",
        name: "3 Dias - R$ 12,90",
        price: 12.9,
        duration: 3,
        type: "BASIC",
      },
      {
        id: "4562be0f-3d64-4b73-a4e6-0301bc7636e7",
        name: "7 Dias - R$ 24,90",
        price: 24.9,
        duration: 7,
        type: "BASIC",
      },
      {
        id: "abfdd079-7706-4efc-8b3b-5ebe10299657",
        name: "15 Dias - R$ 39,90",
        price: 39.9,
        duration: 15,
        type: "PREMIUM",
      },
      {
        id: "87e1a0c6-908b-4123-95da-9d2f7d2a308d",
        name: "30 Dias - R$ 49,90",
        price: 49.9,
        duration: 30,
        type: "PREMIUM",
      },
    ],
  });
});

/** POST /api/v1/plans/subscribe - Assinar um plano */
app.post("/api/v1/plans/subscribe", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { planId } = req.body || {};
  if (!planId) {
    return res.status(400).json({ message: "planId é obrigatório" });
  }

  let durationDays = 30; // default
  if (planId === "e1042858-a403-4524-90ef-46d5d7a3670c" || planId === "test") durationDays = 1;
  else if (planId === "9c9fde4e-5115-46d4-b724-13aa9652520e" || planId === "three-days") durationDays = 3;
  else if (planId === "4562be0f-3d64-4b73-a4e6-0301bc7636e7" || planId === "seven-days") durationDays = 7;
  else if (planId === "abfdd079-7706-4efc-8b3b-5ebe10299657" || planId === "fifteen-days") durationDays = 15;
  else if (planId === "87e1a0c6-908b-4123-95da-9d2f7d2a308d" || planId === "monthly") durationDays = 30;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const sub = {
    planId,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  userSubscriptions.set(user.id, sub);

  res.json({
    planId,
    userId: user.id,
    startedAt: sub.startedAt,
    expiresAt: sub.expiresAt,
  });
});

/** POST /api/v1/plans/cancel - Cancelar plano */
app.post("/api/v1/plans/cancel", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  userSubscriptions.delete(user.id);

  res.json({ message: "Plano cancelado com sucesso", planId: null, expiresAt: null });
});

const pendingPayments = new Map();
const paymentHistory = new Map();

function getPlanPrice(planId) {
  const prices = {
    "e1042858-a403-4524-90ef-46d5d7a3670c": 0.01,
    "test": 0.01,
    "9c9fde4e-5115-46d4-b724-13aa9652520e": 12.9,
    "three-days": 12.9,
    "4562be0f-3d64-4b73-a4e6-0301bc7636e7": 24.9,
    "seven-days": 24.9,
    "abfdd079-7706-4efc-8b3b-5ebe10299657": 39.9,
    "fifteen-days": 39.9,
    "87e1a0c6-908b-4123-95da-9d2f7d2a308d": 49.9,
    "monthly": 49.9,
  };
  return prices[planId] || 29.90;
}

function getPlanName(planId) {
  const names = {
    "e1042858-a403-4524-90ef-46d5d7a3670c": "Plano Teste",
    "test": "Plano Teste",
    "9c9fde4e-5115-46d4-b724-13aa9652520e": "3 Dias",
    "three-days": "3 Dias",
    "4562be0f-3d64-4b73-a4e6-0301bc7636e7": "7 Dias",
    "seven-days": "7 Dias",
    "abfdd079-7706-4efc-8b3b-5ebe10299657": "15 Dias",
    "fifteen-days": "15 Dias",
    "87e1a0c6-908b-4123-95da-9d2f7d2a308d": "30 Dias",
    "monthly": "30 Dias",
  };
  return names[planId] || "Plano Premium";
}

function getDurationDays(planId) {
  if (planId === "e1042858-a403-4524-90ef-46d5d7a3670c" || planId === "test") return 1;
  if (planId === "9c9fde4e-5115-46d4-b724-13aa9652520e" || planId === "three-days") return 3;
  if (planId === "4562be0f-3d64-4b73-a4e6-0301bc7636e7" || planId === "seven-days") return 7;
  if (planId === "abfdd079-7706-4efc-8b3b-5ebe10299657" || planId === "fifteen-days") return 15;
  if (planId === "87e1a0c6-908b-4123-95da-9d2f7d2a308d" || planId === "monthly") return 30;
  return 30;
}

/** POST /api/v1/payments/create - Criar pagamento (Mercado Pago) */
app.post("/api/v1/payments/create", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { planId, groupId } = req.body || {};
  if (!planId) {
    return res.status(400).json({ message: "planId é obrigatório" });
  }

  const mockPaymentId = `mock_pay_${Date.now()}`;
  
  pendingPayments.set(mockPaymentId, {
    id: mockPaymentId,
    planId,
    groupId: groupId || null,
    userId: user.id,
    amount: getPlanPrice(planId),
    createdAt: new Date().toISOString(),
  });

  res.json({
    id: mockPaymentId,
    init_point: `${CLIENT_ORIGIN}/payment-status?payment_id=${mockPaymentId}`,
    status: "pending",
    planId,
    groupId: groupId || null,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
});

/** GET /api/v1/payments/status - Verificar status do pagamento */
app.get("/api/v1/payments/status", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const { payment_id } = req.query;
  if (!payment_id) {
    return res.status(400).json({ message: "payment_id é obrigatório" });
  }

  // 1. Verificar se já está na história aprovado
  let payment = paymentHistory.get(payment_id);
  if (payment) {
    return res.json(payment);
  }

  // 2. Se estiver pendente, aprovar agora e criar assinatura
  payment = pendingPayments.get(payment_id);
  if (payment) {
    const durationDays = getDurationDays(payment.planId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    // Ativa a subscription do usuário
    userSubscriptions.set(user.id, {
      planId: payment.planId,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    const approvedPayment = {
      id: payment.id,
      status: "approved",
      statusDetail: "accredited",
      amount: payment.amount,
      planName: getPlanName(payment.planId),
      planId: payment.planId,
      expiresAt: expiresAt.toISOString(),
      userId: user.id,
      createdAt: payment.createdAt,
    };

    // Mover de pendente para histórico aprovado
    paymentHistory.set(payment_id, approvedPayment);
    pendingPayments.delete(payment_id);

    return res.json(approvedPayment);
  }

  // 3. Fallback / Mock genérico se não achou nos mapas (ex: se recarregou e perdeu memória, ou id arbitrário)
  const durationDays = 30;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  
  // Ativa um plano padrão por precaução
  const defaultPlanId = "87e1a0c6-908b-4123-95da-9d2f7d2a308d";
  userSubscriptions.set(user.id, {
    planId: defaultPlanId,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  const genericPayment = {
    id: payment_id,
    status: "approved",
    statusDetail: "accredited",
    amount: 49.90,
    planName: "30 Dias",
    planId: defaultPlanId,
    expiresAt: expiresAt.toISOString(),
    userId: user.id,
    createdAt: now.toISOString(),
  };

  paymentHistory.set(payment_id, genericPayment);
  return res.json(genericPayment);
});

/** GET /api/v1/payments/history - Listar histórico de pagamentos do usuário */
app.get("/api/v1/payments/history", (req, res) => {
  const user = getUser(req);
  if (!user) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  const history = Array.from(paymentHistory.values()).filter(p => p.userId === user.id);
  res.json(history);
});

/** POST /api/v1/payments/webhook - Webhook do Mercado Pago (opcional) */
app.post("/api/v1/payments/webhook", (req, res) => {
  const { data, type } = req.body || {};
  console.log("[WEBHOOK] Recebido:", { type, data });
  
  // Validar assinatura em produção
  // Por agora, apenas confirmar recebimento
  res.json({ received: true, type });
});

app.use((req, res) => {
  res.status(404).json({ message: `${req.method} ${req.path} não implementado` });
});

app.listen(PORT, () => {
  console.log(`API mock → http://localhost:${PORT}/api`);
});
