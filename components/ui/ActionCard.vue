<!-- components/UI/ActionCard.vue -->
<template>
    <div class="action-card">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
      <NuxtLink :to="link" class="btn">Ir</NuxtLink>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    title: string;
    description: string;
    link: string;
  }>()
  </script>
  
  <style scoped>
  .action-card {
    background-color: #ffffff;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .action-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .action-card h2 {
    margin-bottom: 0.5rem;
    font-size: 1.6rem;
    color: #222;
  }
  
  .action-card p {
    margin-bottom: 1rem;
    color: #666;
    font-size: 1rem;
  }
  
  .btn {
    background-color: var(--secondary-color, #007bff);
    color: #fff;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    text-decoration: none;
    transition: background-color 0.3s;
    font-size: 1rem;
  }
  
  .btn:hover {
    background-color: var(--secondary-hover, #0056b3);
  }
  </style>