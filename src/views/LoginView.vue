<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Blood Pressure Tracker</h1>
      <h2>{{ isSignUp ? 'Create Account' : 'Login' }}</h2>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="input-group">
          <label for="email">Email:</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="your@email.com"
          />
        </div>

        <div class="input-group">
          <label for="password">Password:</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="••••••••"
            minlength="6"
          />
        </div>

        <div v-if="isSignUp" class="input-group">
          <label for="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="••••••••"
            minlength="6"
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login') }}
        </button>

        <p class="toggle-mode">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          <a href="#" @click.prevent="toggleMode">
            {{ isSignUp ? 'Login' : 'Sign Up' }}
          </a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { signIn, signUp } = useAuth()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  errorMessage.value = ''
  successMessage.value = ''
  confirmPassword.value = ''
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (isSignUp.value && password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    if (isSignUp.value) {
      await signUp(email.value, password.value)
      successMessage.value = 'Account created! Please check your email to confirm your account.'
      // Note: With Supabase email confirmation, user won't be auto-logged in
      // If you disable email confirmation in Supabase settings, they will be auto-logged in
    } else {
      await signIn(email.value, password.value)
      router.push('/')
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
}

.login-box h1 {
  text-align: center;
  color: #007bff;
  margin-bottom: 10px;
  font-size: 24px;
}

.login-box h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

button[type="submit"] {
  margin-top: 10px;
  width: 100%;
}

.toggle-mode {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.toggle-mode a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.toggle-mode a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
  }

  .login-box h1 {
    font-size: 20px;
  }

  .login-box h2 {
    font-size: 18px;
  }
}
</style>
