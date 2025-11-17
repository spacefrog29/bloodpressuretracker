<template>
  <div id="app">
    <nav v-if="isAuthenticated" class="nav-bar">
      <h1>Blood Pressure Tracker</h1>
      <div class="nav-links">
        <router-link to="/">Dashboard</router-link>
        <router-link to="/chart">Chart</router-link>
        <router-link to="/admin">Admin</router-link>
        <button class="logout-btn" @click="handleLogout">Logout</button>
      </div>
    </nav>

    <router-view v-if="!loading" />

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">Loading...</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'

const router = useRouter()
const { isAuthenticated, loading, checkUser, signOut } = useAuth()

onMounted(async () => {
  await checkUser()
})

const handleLogout = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
    alert('Error signing out: ' + error.message)
  }
}
</script>

<style>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-spinner {
  font-size: 20px;
  color: #007bff;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
</style>
