<template>
  <div class="container">
    <h1>Admin Console</h1>

    <div class="admin-section">
      <h2>Account Information</h2>
      <div class="info-box">
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>User ID:</strong> {{ user?.id }}</p>
        <p><strong>Last Sign In:</strong> {{ formatLastSignIn }}</p>
      </div>
    </div>

    <div class="admin-section">
      <h2>Change Password</h2>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handlePasswordChange">
        <div class="input-group">
          <label for="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            required
            placeholder="••••••••"
            minlength="6"
          />
          <small>Minimum 6 characters</small>
        </div>

        <div class="input-group">
          <label for="confirmNewPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmNewPassword"
            v-model="confirmNewPassword"
            required
            placeholder="••••••••"
            minlength="6"
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Password' }}
        </button>
      </form>
    </div>

    <div class="admin-section">
      <h2>Database Statistics</h2>
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">{{ totalReadings }}</div>
          <div class="stat-label">Total Readings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ oldestReading }}</div>
          <div class="stat-label">Oldest Reading</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ newestReading }}</div>
          <div class="stat-label">Newest Reading</div>
        </div>
      </div>
    </div>

    <div class="admin-section danger-zone">
      <h2>Danger Zone</h2>
      <p>These actions cannot be undone. Please be careful!</p>
      <button class="delete-btn" @click="deleteAllReadings">
        Delete All Readings
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../services/supabase'

const { user, updatePassword } = useAuth()

const newPassword = ref('')
const confirmNewPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const totalReadings = ref(0)
const oldestReading = ref('-')
const newestReading = ref('-')

const formatLastSignIn = computed(() => {
  if (!user.value?.last_sign_in_at) return 'N/A'
  return new Date(user.value.last_sign_in_at).toLocaleString('en-GB')
})

const handlePasswordChange = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value !== confirmNewPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true

  try {
    await updatePassword(newPassword.value)
    successMessage.value = 'Password updated successfully!'
    newPassword.value = ''
    confirmNewPassword.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'Failed to update password'
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const { data, error } = await supabase
      .from('blood_pressure_readings')
      .select('reading_date')
      .order('reading_date', { ascending: true })

    if (error) throw error

    totalReadings.value = data.length

    if (data.length > 0) {
      oldestReading.value = new Date(data[0].reading_date).toLocaleDateString('en-GB')
      newestReading.value = new Date(data[data.length - 1].reading_date).toLocaleDateString('en-GB')
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const deleteAllReadings = async () => {
  const confirmed = confirm(
    'Are you sure you want to delete ALL readings? This action cannot be undone!'
  )

  if (!confirmed) return

  const doubleConfirm = confirm(
    'This is your last chance! Are you absolutely sure you want to delete everything?'
  )

  if (!doubleConfirm) return

  try {
    const { error } = await supabase
      .from('blood_pressure_readings')
      .delete()
      .neq('id', 0) // This deletes all rows

    if (error) throw error

    alert('All readings have been deleted')
    loadStats()
  } catch (error) {
    console.error('Error deleting readings:', error)
    alert('Error deleting readings: ' + error.message)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.container {
  margin: 20px auto;
}

.admin-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 20px;
  border-left: 4px solid #007bff;
}

.admin-section h2 {
  margin-bottom: 15px;
}

.info-box {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.info-box p {
  margin: 10px 0;
  color: #555;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 500px;
}

.input-group small {
  color: #666;
  font-size: 12px;
  margin-top: 3px;
}

button[type="submit"] {
  width: fit-content;
}

.danger-zone {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.danger-zone p {
  color: #721c24;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .admin-section {
    padding: 15px;
  }

  form {
    max-width: 100%;
  }
}
</style>
