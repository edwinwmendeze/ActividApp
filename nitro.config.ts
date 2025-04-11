// Configuración avanzada para Nitro (el servidor de Nuxt)
// Este archivo tiene prioridad sobre la configuración en nuxt.config.ts

export default defineNitroConfig({
  prerender: {
    // No prerender ningún enlace
    crawlLinks: false,
    // Solo prerender la página principal
    routes: ['/'],
    // Ignorar errores de prerenderizado para permitir que la compilación continue
    ignore: [
      '/acceso-codigo',
      '/supabase-test',
      '/crear-actividad',
      '/escanear-pedido',
      '/colaborador/**',
      '/admin/**'
    ],
    // No fallar en caso de errores de prerenderizado
    failOnError: false
  }
});
