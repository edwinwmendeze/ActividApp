<!-- pages/index.vue -->
<template>
    <div class="container">
      <!-- Sección Hero con ilustración -->
      <div class="hero">
        <div class="hero-content">
          <h1 class="hero-title">ActividApp</h1>
          <p class="hero-tagline">Organiza eventos comunitarios sin complicaciones</p>
          <p class="hero-description">
            Plataforma integral para gestionar ventas, pedidos y colaboradores en tus actividades comunitarias.
          </p>
          <div class="hero-buttons">
            <NuxtLink to="/crear-actividad" class="cta-button primary">Iniciar nueva actividad</NuxtLink>
            <NuxtLink to="/supabase-test" class="cta-button secondary">Verificar conexión</NuxtLink>
          </div>
        </div>
        <div class="hero-image">
          <!-- Imagen o ilustración representativa -->
          <div class="illustration">
            <div class="illustration-box">
              <div class="illustration-icon">📋</div>
            </div>
            <div class="illustration-box">
              <div class="illustration-icon">🍽️</div>
            </div>
            <div class="illustration-box">
              <div class="illustration-icon">📱</div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Sección de Cómo Funciona -->
      <div class="how-it-works">
        <h2>Cómo funciona</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Crea tu actividad</h3>
            <p>Configura los detalles básicos y obtén un código de acceso único.</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>Añade colaboradores</h3>
            <p>Invita a vendedores y asígnales roles específicos.</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>Administra pedidos</h3>
            <p>Gestiona ventas, pagos y entregas desde un panel central.</p>
          </div>
        </div>
      </div>
  
      <!-- Sección de Características -->
      <div class="features">
        <div class="feature-item">
          <div class="feature-icon">🚀</div>
          <h2>Crear Actividad</h2>
          <p>Configura una nueva actividad, genera códigos únicos y personaliza las opciones de venta.</p>
          <NuxtLink to="/crear-actividad" class="cta-button">Crear Nueva Actividad</NuxtLink>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔑</div>
          <h2>Acceder con Código</h2>
          <p>Ingresa con tu código de 6 dígitos o escanea el QR para administrar tu actividad existente.</p>
          <NuxtLink to="/acceso-codigo" class="cta-button">Acceder con Código</NuxtLink>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📊</div>
          <h2>Gestión de Pedidos</h2>
          <p>Sistema completo para administrar pedidos, controlar pagos y hacer seguimiento a las entregas.</p>
          <NuxtLink to="/panel-colaboradores" class="cta-button">Acceder al Panel</NuxtLink>
        </div>
      </div>
  
      <!-- Sección de Beneficios -->
      <div class="benefits">
        <h2>Beneficios de ActividApp</h2>
        <div class="benefits-grid">
          <div class="benefit">
            <div class="benefit-icon">✅</div>
            <div class="benefit-text">
              <h3>Fácil de usar</h3>
              <p>Interfaz intuitiva sin necesidad de capacitación.</p>
            </div>
          </div>
          <div class="benefit">
            <div class="benefit-icon">✅</div>
            <div class="benefit-text">
              <h3>Sin instalación</h3>
              <p>Funciona en cualquier dispositivo con navegador web.</p>
            </div>
          </div>
          <div class="benefit">
            <div class="benefit-icon">✅</div>
            <div class="benefit-text">
              <h3>Tarjeta virtual</h3>
              <p>Los clientes pueden ver el estado de sus pedidos fácilmente.</p>
            </div>
          </div>
          <div class="benefit">
            <div class="benefit-icon">✅</div>
            <div class="benefit-text">
              <h3>Control de pagos</h3>
              <p>Seguimiento claro de pedidos pagados y pendientes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // No hay lógica adicional en este momento
  </script>
  
  <style scoped>
  /* Hero section */
  .hero {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-large);
    margin-bottom: var(--spacing-xlarge);
    padding: var(--spacing-large) 0;
  }
  
  .hero-content {
    flex: 1;
    min-width: 300px;
  }
  
  .hero-title {
    font-size: 3rem;
    margin-bottom: var(--spacing-small);
    color: var(--primary-color);
  }
  
  .hero-tagline {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-medium);
    color: var(--text-color-dark);
  }
  
  .hero-description {
    font-size: var(--font-size-large);
    margin-bottom: var(--spacing-large);
    color: var(--text-color);
    max-width: 600px;
  }
  
  .hero-buttons {
    display: flex;
    gap: var(--spacing-medium);
    flex-wrap: wrap;
  }
  
  .hero-image {
    flex: 1;
    min-width: 300px;
    display: flex;
    justify-content: center;
  }
  
  /* Ilustración simplificada */
  .illustration {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-medium);
    justify-content: center;
  }
  
  .illustration-box {
    width: 100px;
    height: 100px;
    background-color: var(--accent-color);
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .illustration-icon {
    font-size: 2.5rem;
  }
  
  /* How it works section */
  .how-it-works {
    text-align: center;
    margin-bottom: var(--spacing-xlarge);
    padding: var(--spacing-large) 0;
  }
  
  .how-it-works h2 {
    font-size: 2rem;
    margin-bottom: var(--spacing-large);
    color: var(--primary-color);
  }
  
  .steps {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-medium);
    justify-content: center;
  }
  
  .step {
    flex: 1;
    min-width: 250px;
    max-width: 300px;
    padding: var(--spacing-medium);
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    font-weight: bold;
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .step h3 {
    margin-top: var(--spacing-small);
    margin-bottom: var(--spacing-small);
    color: var(--text-color-dark);
  }
  
  .step p {
    color: var(--text-color);
  }
  
  /* Features section */
  .features {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-medium);
    justify-content: center;
    margin-bottom: var(--spacing-xlarge);
  }
  
  .feature-item {
    background-color: var(--accent-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-medium);
    flex: 1;
    min-width: 280px;
    max-width: 350px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .feature-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-small);
  }
  
  .feature-item h2 {
    font-size: 1.6rem;
    margin-bottom: var(--spacing-small);
    color: var(--primary-color);
  }
  
  .feature-item p {
    font-size: var(--font-size-base);
    margin-bottom: var(--spacing-medium);
    color: var(--text-color);
  }
  
  /* Benefits section */
  .benefits {
    margin-bottom: var(--spacing-xlarge);
    padding: var(--spacing-large) 0;
  }
  
  .benefits h2 {
    font-size: 2rem;
    margin-bottom: var(--spacing-large);
    color: var(--primary-color);
    text-align: center;
  }
  
  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-medium);
  }
  
  .benefit {
    display: flex;
    align-items: center;
    gap: var(--spacing-small);
    padding: var(--spacing-small);
    background-color: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .benefit-icon {
    font-size: 1.5rem;
    color: var(--primary-color);
  }
  
  .benefit-text h3 {
    font-size: var(--font-size-large);
    margin-bottom: var(--spacing-xsmall);
    color: var(--text-color-dark);
  }
  
  .benefit-text p {
    font-size: var(--font-size-base);
    color: var(--text-color);
  }
  
  /* Botones CTA */
  .cta-button {
    display: inline-block;
    padding: var(--spacing-small) var(--spacing-medium);
    background-color: var(--button-bg);
    color: #fff;
    border: none;
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    text-align: center;
    margin-top: auto;
    text-decoration: none;
    transition: background-color 0.2s, transform 0.2s;
  }
  
  .cta-button:hover {
    background-color: var(--button-bg-hover);
    transform: translateY(-2px);
  }
  
  .cta-button.primary {
    font-weight: bold;
    padding: var(--spacing-small) var(--spacing-large);
  }
  
  .cta-button.secondary {
    background-color: transparent;
    border: 1px solid var(--button-bg);
    color: var(--button-bg);
  }
  
  .cta-button.secondary:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }
    
    .hero-tagline {
      font-size: 1.2rem;
    }
    
    .hero-buttons {
      flex-direction: column;
      gap: var(--spacing-small);
    }
    
    .hero-buttons .cta-button {
      width: 100%;
    }
  }
  </style>