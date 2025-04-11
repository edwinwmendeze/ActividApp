// middleware/router.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const baseUrl = '/ActividApp'
  
  // Solo ejecutar en el cliente y solo para rutas que no tengan ya el prefijo
  if (process.client && !to.fullPath.startsWith(baseUrl) && to.fullPath !== '/') {
    console.log(`[Router Middleware] Redirigiendo: ${to.fullPath} → ${baseUrl}${to.fullPath}`)
    return navigateTo(`${baseUrl}${to.fullPath}`, { replace: true })
  }
})
