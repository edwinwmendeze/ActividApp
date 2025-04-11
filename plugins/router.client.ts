// plugins/router.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const baseURL = '/ActividApp/'
  const config = useRuntimeConfig()

  // Intercepta todas las navegaciones internas
  nuxtApp.hook('app:mounted', () => {
    // Solo ejecuta este código en el cliente
    if (process.client) {
      const router = useRouter()

      // Intercepta las navegaciones
      router.beforeEach((to, from, next) => {
        // Si la ruta ya incluye el prefijo base, simplemente continúa
        if (to.path.startsWith(baseURL)) {
          return next()
        }

        // Agrega el prefijo base a la ruta
        const newPath = baseURL + to.path.replace(/^\//, '')
        console.log(`[Router Plugin] Redirigiendo: ${to.path} → ${newPath}`)
        return next({
          path: newPath,
          query: to.query,
          hash: to.hash,
          replace: true
        })
      })
    }
  })

  // Para redirigir enlaces de ancla href regulares
  nuxtApp.hook('page:finish', () => {
    if (process.client) {
      document.querySelectorAll('a:not([href^="http"]):not([href^="mailto"]):not([href^="tel"])')
        .forEach(anchor => {
          const href = anchor.getAttribute('href')
          if (href && href.startsWith('/') && !href.startsWith(baseURL)) {
            anchor.setAttribute('href', baseURL + href.slice(1))
          }
        })
    }
  })
})
