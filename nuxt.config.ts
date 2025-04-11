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
    key: process.env.NUXT_SUPABASE_KEY,
    // Configuraciones de seguridad recomendadas
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production'
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseKey: process.env.NUXT_SUPABASE_KEY
    }
  },
  // Configuración específica para resolver problemas de prerender
  nitro: {
    preset: process.env.NITRO_PRESET || 'node-server',
    prerender: {
      // Configuración para evitar prerender rutas dinámicas
      ignore: [
        '/',  // Ignorar explícitamente la ruta principal
        '/admin/**',  // Ignorar todas las rutas de admin
        '/colaborador/**',  // Ignorar todas las rutas de colaborador
        '/actividad/**'  // Ignorar todas las rutas de actividad
      ],
      failOnError: false,  // No fallar si hay errores en prerender
      crawlLinks: false,   // No rastrear links automáticamente
      routes: [
        '/404.html',
        '/200.html'
      ]
    },
    // Configuración de renderizado del lado del cliente para páginas que usan Supabase
    routeRules: {
      '/': { ssr: false },  // Desactivar SSR para la página principal
      '/admin/**': { ssr: false },  // Desactivar SSR para rutas de admin
      '/colaborador/**': { ssr: false },  // Desactivar SSR para rutas de colaborador
      '/actividad/**': { ssr: false },  // Desactivar SSR para rutas de actividad
    }
  }
})