// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },


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
  }
})