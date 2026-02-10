import Fastify from 'fastify';
import cors from '@fastify/cors';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { users } from './db/schema';
import 'dotenv/config';

const server = Fastify({ logger: true });

// 1. Configuración de la base de datos (Traído de app.ts)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// 2. Registro de plugins
server.register(cors, { origin: '*' });

// 3. Ruta de registro
server.post('/register', async (request, reply) => {
  const { username, email, password } = request.body as any;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.insert(users).values({ 
      username, 
      email, 
      password: hashedPassword 
    }).returning();

    // No devolvemos el password al cliente
    const { password: _pw, ...safeUser } = newUser[0];

    return reply.status(201).send({ success: true, user: safeUser });
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ success: false, error: 'Registration failed' });
  }
});

// 4. Ruta de login (recuperar datos de la BD y validar contraseña)
server.post('/login', async (request, reply) => {
  const { username, email, password } = request.body as any;

  if (!password || (!username && !email)) {
    return reply.status(400).send({ success: false, error: 'Faltan credenciales' });
  }

  try {
    // Buscar usuario por username o por email
    const foundUsers = await db
      .select()
      .from(users)
      .where(username ? eq(users.username, username) : eq(users.email, email));
    const user = foundUsers[0];

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Usuario o contraseña incorrectos' });
    }

    // Comparar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.status(401).send({ success: false, error: 'Usuario o contraseña incorrectos' });
    }

    // Devolver datos seguros (sin password)
    const { password: _pw, ...safeUser } = user;

    return reply.status(200).send({ success: true, user: safeUser });
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ success: false, error: 'Login failed' });
  }
});

// 5. Ruta de prueba
server.get('/ping', async () => {
  return { pong: 'it works!' };
});

// 6. Arranque del servidor
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();