import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'

const user = ref(null)
const loading = ref(true)

export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null)

  const checkUser = async () => {
    loading.value = true
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
    } catch (error) {
      console.error('Error checking user:', error)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    user.value = data.user
    return data
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error
    user.value = data.user
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
    return data
  }

  // Listen to auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
  })

  return {
    user,
    loading,
    isAuthenticated,
    checkUser,
    signIn,
    signUp,
    signOut,
    updatePassword
  }
}
