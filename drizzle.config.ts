import 'dotenv/config'; // Esto carga las variables del archivo .env
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",               // Especificamos la ubicación del archivo de esquema de Drizzle, que define la estructura de la base de datos
  out: "./drizzle",                           // Especificamos la carpeta de salida para los archivos generados por Drizzle, como migraciones y tipos de TypeScript
  dialect: "postgresql",                      // Especificamos el dialecto de la base de datos que estamos utilizando, en este caso PostgreSQL
  dbCredentials: {
    url: process.env.DATABASE_URL!,           // Utilizamos la variable de entorno DATABASE_URL para obtener la URL de conexión a la base de datos, asegurándonos de que esté definida
  }
});