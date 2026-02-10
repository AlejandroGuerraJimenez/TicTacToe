import { buildApp } from './app';

const app = buildApp();

app.listen({ port: 3000 }, (err, address) => {          // Iniciamos el servidor en el puerto 3000 
  if (err) {                                            // Si ocurre un error al iniciar el servidor, lo registramos y salimos del proceso
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);          // Si no ocurre ningún error, mostramos un mensaje indicando que el servidor activo y en qué dirección
});
