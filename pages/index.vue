<!-- pages/index.vue -->
<template>
  <div class="home-container">
    <!-- Header Section -->
    <header class="home-header">
      <div class="brand">
        <span class="brand-icon">📊</span>
        <h1 class="brand-name">ActividApp</h1>
      </div>
      <p class="brand-tagline">Gestión simple para eventos comunitarios</p>
    </header>

    <!-- Action Cards -->
    <div class="action-cards">
      <div class="action-card primary">
        <div class="card-icon">🚀</div>
        <div class="card-content">
          <h2>Crear actividad</h2>
          <p>Configura un nuevo evento en segundos</p>
          <NuxtLink to="/crear-actividad" class="action-button">Comenzar</NuxtLink>
        </div>
      </div>

      <div class="action-card secondary">
        <div class="card-icon">🔑</div>
        <div class="card-content">
          <h2>Acceder</h2>
          <p>Ingresa a una actividad existente</p>
          <NuxtLink to="/acceso-codigo" class="action-button">Ingresar código</NuxtLink>
        </div>
      </div>

      <div class="action-card tertiary">
        <div class="card-icon">📱</div>
        <div class="card-content">
          <h2>Escanear QR</h2>
          <p>Verifica pedidos fácilmente</p>
          <NuxtLink to="/escanear-pedido" class="action-button">Escanear</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <h3>Accesos rápidos</h3>
      <div class="links-container">
        <NuxtLink to="/panel-colaboradores" class="quick-link">
          <span class="link-icon">👥</span>
          <span>Panel de colaboradores</span>
        </NuxtLink>
        <NuxtLink to="/mis-pedidos" class="quick-link">
          <span class="link-icon">🧾</span>
          <span>Mis pedidos</span>
        </NuxtLink>
        <NuxtLink to="/mis-actividades" class="quick-link">
          <span class="link-icon">📅</span>
          <span>Mis actividades</span>
        </NuxtLink>
        <NuxtLink to="/ayuda" class="quick-link">
          <span class="link-icon">❓</span>
          <span>Ayuda</span>
        </NuxtLink>
      </div>
    </div>

    <footer class="home-footer">
      <p> 2024 ActividApp - Simplificando la gestión de eventos</p>
    </footer>
  </div>
</template>

<script setup>
// No extra logic needed for now
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  background-color: var(--bg-color, #f8f9fa);
}

/* Header Styles */
.home-header {
  text-align: center;
  margin-bottom: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.brand-icon {
  font-size: 2.5rem;
}

.brand-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color, #4CAF50);
  margin: 0;
}

.brand-tagline {
  font-size: 1.2rem;
  color: var(--text-color, #666);
  margin: 0;
}

/* Action Cards */
.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  position: relative;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  background-color: var(--primary-color, #4CAF50);
}

.action-card.primary::before {
  background-color: var(--primary-color, #4CAF50);
}

.action-card.secondary::before {
  background-color: var(--secondary-color, #2196F3);
}

.action-card.tertiary::before {
  background-color: var(--tertiary-color, #FF9800);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  padding: 1.5rem;
}

.card-content {
  flex: 1;
  padding: 1.5rem 1.5rem 1.5rem 0;
  display: flex;
  flex-direction: column;
}

.card-content h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  color: var(--text-color-dark, #333);
}

.card-content p {
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
  color: var(--text-color, #666);
  flex: 1;
}

.action-button {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background-color: var(--primary-color, #4CAF50);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.action-button:hover {
  background-color: var(--primary-color-dark, #3d8b40);
}

/* Quick Links Section */
.quick-links {
  margin-top: 1rem;
}

.quick-links h3 {
  font-size: 1.2rem;
  color: var(--text-color-dark, #333);
  margin-bottom: 1rem;
  text-align: center;
}

.links-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.quick-link {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color-dark, #333);
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.quick-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.link-icon {
  font-size: 1.2rem;
  margin-right: 0.7rem;
}

/* Footer */
.home-footer {
  margin-top: auto;
  text-align: center;
  padding-top: 2rem;
  color: var(--text-color, #666);
  font-size: 0.9rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .home-container {
    padding: 1.5rem;
    gap: 2rem;
  }
  
  .brand-name {
    font-size: 2rem;
  }
  
  .action-cards {
    grid-template-columns: 1fr;
  }
}
</style>