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
  
  // Configuración para GitHub Pages
  app: {
    // La URL base para el proyecto en GitHub Pages
    baseURL: '/ActividApp/',
    // Prefijo para los archivos buildeados
    buildAssetsDir: '/_nuxt/'
  },

  // Desactivar SSR para crear una SPA pura
  ssr: false,
  
  // Configuración para manejo de enlaces en GitHub Pages
  experimental: {
    payloadExtraction: false
  },
  
  // Configuración de nitro para controlar el prerenderizado
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ['/']
    },
    routeRules: {
      '/**': { ssr: false }
    }
  }
})