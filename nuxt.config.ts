// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  imports: {
    dirs: ['types']
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/eslint',
    '@nuxtjs/supabase'
  ],
  css: [
    '~/assets/css/resets.css',
    '~/assets/css/variables.css',
    '~/assets/css/base.css',
    '~/assets/css/layout.css'
  ],
  supabase: {
    // Desactivar completamente el redireccionamiento
    redirect: false,
    // Agregar explícitamente las credenciales
    url: process.env.NUXT_SUPABASE_URL,
    key: process.env.NUXT_SUPABASE_KEY
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseKey: process.env.NUXT_SUPABASE_KEY
    }
  },
  // Configurar prerenderizado para evitar errores durante la generación estática
  nitro: {
    prerender: {
      // Solo prerenderizar la página de inicio
      routes: ['/'],
      // Ignorar los errores de prerenderizado para permitir que la compilación continúe
      ignore: [
        // Ignorar rutas problemáticas
        '/acceso-codigo',
        '/supabase-test',
        '/crear-actividad',
        '/escanear-pedido',
        '/colaborador/admin/**',
        '/admin/**'
      ]
    }
  },
  // Configurar modo de generación para SPA en rutas dinámicas
  routeRules: {
    '/admin/**': { ssr: false },
    '/colaborador/**': { ssr: false },
    '/acceso-codigo': { ssr: false },
    '/crear-actividad': { ssr: false },
    '/escanear-pedido': { ssr: false },
    '/supabase-test': { ssr: false }
  }
})