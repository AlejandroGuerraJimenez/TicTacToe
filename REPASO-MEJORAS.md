# Repaso del proyecto TicTacToe — Mejoras e ineficiencias

## Backend

### Ineficiencias


1. **Varias instancias de Pool de PostgreSQL** ✅ Implementado
   - Antes: `server.ts`, `routes/friends.ts` y `routes/games.ts` creaban cada uno su propio `new Pool()` y `drizzle(pool)`.
   - **Solución**: Se creó `src/db/connection.ts` con una única instancia de `Pool` y `db`; `server.ts` y las rutas importan `db` desde ahí.

2. **GET /games — Dos consultas en lugar de una** // IMPLEMENTAR
   - Se hacen dos queries: una para partidas como X y otra como O, y luego se fusionan en memoria.
   - **Mejora**: Una sola query con `where(or(eq(games.playerXId, userId), eq(games.playerOId, userId)))` y un join con `users` para el oponente (usando `case when` o dos joins laterales si hace falta el username según el rol). Reduce round-trips a la BD.

3. **Logs en producción (realtime)**
   - `realtime.ts` usa `console.log` para cada evento enviado y cada conexión/desconexión.
   - **Mejora**: Usar `server.log.info/debug` y bajar el nivel en producción, o quitar logs muy frecuentes para evitar ruido.

4. **Código muerto: `app.ts`**
   - Existe `app.ts` con otro `Pool` y rutas de registro antiguas; `server.ts` no lo usa.
   - **Mejora**: Eliminar `app.ts` si no se usa, o integrarlo en una única entrada para no tener dos “apps”.

### Seguridad

5. **Secrets por defecto**
   - `JWT_SECRET` y `COOKIE_SECRET` tienen fallbacks (`'supersecret'`, `'cookie-secret'`) si no hay env.
   - **Mejora**: En producción no usar fallback; arrancar solo si `process.env.JWT_SECRET` (y opcionalmente `COOKIE_SECRET`) están definidos, o lanzar un error claro al iniciar.

6. **CORS fijo**
   - `origin: 'http://localhost:4200'` está hardcodeado.
   - **Mejora**: Leer de `process.env.CORS_ORIGIN` o similar para poder usar otra URL en staging/producción.

7. **Cookie `secure: false`**
   - La cookie de sesión se envía sin `secure: true`.
   - **Mejora**: En producción usar `secure: process.env.NODE_ENV === 'production'` (o equivalente) para que la cookie solo vaya por HTTPS.

### Consistencia y validación

8. **Login: validación vs uso**
   - Se valida `if (!password || !email)` pero luego se busca por `username ? eq(users.username, username) : eq(users.email, email)`. El front actual solo envía email, así que funciona, pero la API acepta `username` en el body y no lo valida como alternativa.
   - **Mejora**: Dejar claro en la API: “login por email” o “por email o username”. Si es solo email, no usar `username` en la query; si se permite username, validar `email || username` en lugar de solo `!email`.

9. **Register: mensaje de longitud**   // IMPLEMENTAR
   - Mensaje de error dice “mín. 2 caracteres” pero la validación exige `username.length < 4` (mínimo 4).
   - **Mejora**: Unificar: o bien mínimo 2 y cambiar la condición, o bien mínimo 4 y corregir el mensaje a “mín. 4 caracteres”.

10. **Orden en `games.ts`**    // IMPLEMENTAR
    - La función `deleteGameChat` está definida antes de `import 'dotenv/config'` y de la creación de `db`; conceptualmente el archivo quedaría más claro con imports y creación de `db` al inicio y luego las funciones que lo usan.

### Tipado

11. **`request.body as any`**     // IMPLEMENTAR usar DTO login y response
    - En varias rutas se hace cast a `any` para el body.
    - **Mejora**: Definir interfaces (p. ej. `LoginBody`, `RegisterBody`, `MoveBody`) y usarlas en lugar de `any` para menos errores y mejor documentación.

---

## Frontend

### Ineficiencias

12. **URL de API repetida y hardcodeada**
    - `auth.service.ts`, `realtime.service.ts`, `games.service.ts` y `friends.service.ts` tienen cada uno `apiUrl = 'http://localhost:3000'` (o con path).
    - **Problema**: Cambio de entorno costoso y propenso a errores; duplicación.
    - **Mejora**: Un solo origen de verdad, por ejemplo `environment.ts` (o `environment.development.ts` / `environment.production.ts`) con `apiUrl` y usarlo en un único lugar (p. ej. un “api” service o inyección en los servicios que llaman al backend).

13. **Múltiples suscripciones a `realtime.events$`**
    - HomeComponent y otros (games, game-chat, etc.) se suscriben a `events$` por separado.
    - **Estado**: Es un patrón aceptable; solo asegurar que en componentes que ya no se usan se haga `unsubscribe` (p. ej. en `ngOnDestroy`) para no dejar suscripciones vivas. Revisar que todos los que se suscriben hagan `unsubscribe`.

14. **Posible doble llamada a `loadChat`**
    - En game-chat, al abrir el panel se llama `loadChat(this.messages.length > 0)`. Si el usuario abre/cierra/abre rápido, puede haber varias peticiones.
    - **Mejora** (opcional): Debounce o flag “loading” para no disparar otra carga mientras una está en curso.

### Calidad de código

15. **`console.log` en producción**
    - `AuthService.isAuthenticated()` y `auth.guard.ts` tienen `console.log` de depuración.
    - **Mejora**: Quitarlos o usar un logger condicionado a entorno de desarrollo.

16. **Tipado `any`**                   // IMPLEMENTAR usar DTO login y response
    - `AuthService`: `BehaviorSubject<any>`, `currentUser$` y respuestas de login/register con `any`.
    - **Mejora**: Definir una interfaz `User` (id, username, email) y usarla en el subject y en los tipos de respuesta del API.

17. **Manejo de errores HTTP**
    - En varios sitios se usa `err.error?.error` asumiendo una forma concreta del backend.
    - **Mejora**: Centralizar en un interceptor o en un método helper que unifique el mensaje (p. ej. `err.error?.error || err.message || 'Error de conexión'`) y opcionalmente mostrar toasts desde ahí.

### UX / robustez

18. **Reconexión WebSocket sin feedback**x
    - Si el WS se cae, se reintenta en segundo plano pero el usuario no ve un aviso.
    - **Mejora**: Opcional: mostrar un pequeño toast “Reconectando…” cuando se dispare la reconexión y “Conectado” al recuperar, para que no parezca que la app está rota.

19. **Sesión expirada**
    - Si el JWT caduca, las peticiones HTTP devolverán 401 pero no hay un flujo global que redirija a login y limpie estado.
    - **Mejora**: Interceptor HTTP que en 401 llame a logout, limpie usuario y redirija a `/login`, para que no queden pantallas a medias.

---

## Resumen de prioridades

| Prioridad | Tema | Dónde |
|-----------|------|--------|
| Alta | Un solo Pool / una sola instancia `db` | Backend (server + routes) |
| Alta | API base URL desde environment | Frontend (todos los services) |
| Alta | Quitar o condicionar secrets por defecto | Backend server.ts |
| Media | Una sola query para listado de partidas | Backend GET /games |
| Media | Quitar `console.log` de guard y auth | Frontend |
| Media | Interceptor 401 → logout y redirect a login | Frontend |
| Baja | CORS y cookie `secure` desde env | Backend |
| Baja | Tipado User y bodies | Backend + Frontend |
| Baja | Mensajes de error y validación (register/login) | Backend |

Si quieres, el siguiente paso puede ser implementar solo las de prioridad alta (Pool único, environment en frontend, secrets) y el interceptor 401.
