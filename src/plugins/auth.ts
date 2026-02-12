import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware para verificar que el usuario está autenticado mediante JWT en cookie.
 * Si el token es válido, fastify-jwt añade automáticamente `request.user`.
 * Si no, lanza un error que Fastify gestiona (generalmente 401).
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        // Re-lanzar para que Fastify no ejecute el handler (evita request.user undefined y doble respuesta)
        throw err;
    }
}
