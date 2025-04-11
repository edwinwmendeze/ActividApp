// app/router.options.ts
import type { RouterConfig } from '@nuxt/schema'

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig> {
  routes: (_routes) => {
    const base = '/ActividApp'
    return _routes.map(route => {
      // Ya no necesitamos añadir el prefijo aquí porque lo manejamos en el plugin
      return route
    })
  },
  scrollBehavior(to, from, savedPosition) {
    // Comportamiento de desplazamiento predeterminado
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    return { left: 0, top: 0, behavior: 'smooth' }
  },
}
