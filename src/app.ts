import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({ logger: true });                    // Configuramos Fastify para usar su sistema de logging integrado

  app.get('/', async () => {                                // Endpoint raíz para verificar que el servidor está funcionando
    return { message: 'Welcome to the Tic Tac Toe API!' };  // Respondemos con un mensaje de bienvenida en formato JSON
  });
  
  return app;                                               // Devolvemos la instancia de la aplicación Fastify para que pueda ser utilizada en el servidor
}