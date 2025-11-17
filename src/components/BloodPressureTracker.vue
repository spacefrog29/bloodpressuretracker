<template>
  <div>
    <div class="input-section">
      <div class="input-row">
        <div class="input-group">
          <label for="date">Date:</label>
          <input type="date" id="date" v-model="newReading.date" />
        </div>
        <div class="input-group">
          <label for="systolic">Systolic:</label>
          <input
            type="number"
            id="systolic"
            v-model="newReading.systolic"
            placeholder="120"
            min="70"
            max="250"
          />
        </div>
        <div class="input-group">
          <label for="diastolic">Diastolic:</label>
          <input
            type="number"
            id="diastolic"
            v-model="newReading.diastolic"
            placeholder="80"
            min="40"
            max="150"
          />
        </div>
        <div class="input-group">
          <label for="heartRate">Heart Rate:</label>
          <input
            type="number"
            id="heartRate"
            v-model="newReading.heartRate"
            placeholder="72"
            min="40"
            max="200"
          />
        </div>
      </div>
      <div class="button-group">
        <button @click="addReading" :disabled="isLoading">Add Reading</button>
        <button class="export-btn" @click="exportToCSV">Export CSV</button>
      </div>
    </div>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="readings.length > 0" class="stats">
      <div class="stat-card">
        <div class="stat-value">{{ avgSystolic }}</div>
        <div class="stat-label">Avg Systolic</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgDiastolic }}</div>
        <div class="stat-label">Avg Diastolic</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgHeartRate }}</div>
        <div class="stat-label">Avg Heart Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ readings.length }}</div>
        <div class="stat-label">Total Readings</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Systolic</th>
            <th>Diastolic</th>
            <th>Heart Rate</th>
            <th>BP Category</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="readings.length === 0">
            <td colspan="6" style="text-align: center; padding: 20px;">
              No readings yet. Add your first reading above!
            </td>
          </tr>
          <tr v-for="reading in readings" :key="reading.id">
            <td>{{ formatDate(reading.date) }}</td>
            <td>{{ reading.systolic }}</td>
            <td>{{ reading.diastolic }}</td>
            <td>{{ reading.heartRate }}</td>
            <td :class="getCategoryClass(reading.category)">
              {{ reading.category }}
            </td>
            <td>
              <button class="delete-btn" @click="deleteReading(reading.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../services/supabase'

const readings = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const newReading = ref({
  date: new Date().toISOString().split('T')[0],
  systolic: '',
  diastolic: '',
  heartRate: ''
})

const getBPCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) return 'Normal'
  if (systolic < 130 && diastolic < 80) return 'Elevated'
  if (systolic < 140 || diastolic < 90) return 'Stage 1 High'
  if (systolic < 180 || diastolic < 120) return 'Stage 2 High'
  return 'Crisis'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB')
}

const getCategoryClass = (category) => {
  const classMap = {
    'Normal': 'bp-normal',
    'Elevated': 'bp-elevated',
    'Stage 1 High': 'bp-stage1',
    'Stage 2 High': 'bp-stage2',
    'Crisis': 'bp-crisis'
  }
  return classMap[category] || ''
}

const avgSystolic = computed(() => {
  if (readings.value.length === 0) return 0
  const sum = readings.value.reduce((acc, r) => acc + r.systolic, 0)
  return Math.round(sum / readings.value.length)
})

const avgDiastolic = computed(() => {
  if (readings.value.length === 0) return 0
  const sum = readings.value.reduce((acc, r) => acc + r.diastolic, 0)
  return Math.round(sum / readings.value.length)
})

const avgHeartRate = computed(() => {
  if (readings.value.length === 0) return 0
  const sum = readings.value.reduce((acc, r) => acc + r.heartRate, 0)
  return Math.round(sum / readings.value.length)
})

const loadReadings = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('blood_pressure_readings')
      .select('*')
      .order('reading_date', { ascending: false })

    if (error) throw error

    readings.value = data.map(row => ({
      id: row.id,
      date: row.reading_date,
      systolic: row.systolic,
      diastolic: row.diastolic,
      heartRate: row.heart_rate,
      category: getBPCategory(row.systolic, row.diastolic)
    }))
  } catch (error) {
    console.error('Error loading readings:', error)
    errorMessage.value = 'Error loading data: ' + error.message
  } finally {
    isLoading.value = false
  }
}

const addReading = async () => {
  if (!newReading.value.date || !newReading.value.systolic ||
      !newReading.value.diastolic || !newReading.value.heartRate) {
    errorMessage.value = 'Please fill in all fields'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('blood_pressure_readings')
      .insert([{
        reading_date: newReading.value.date,
        systolic: parseInt(newReading.value.systolic),
        diastolic: parseInt(newReading.value.diastolic),
        heart_rate: parseInt(newReading.value.heartRate)
      }])
      .select()

    if (error) throw error

    const reading = {
      id: data[0].id,
      date: newReading.value.date,
      systolic: parseInt(newReading.value.systolic),
      diastolic: parseInt(newReading.value.diastolic),
      heartRate: parseInt(newReading.value.heartRate),
      category: getBPCategory(
        parseInt(newReading.value.systolic),
        parseInt(newReading.value.diastolic)
      )
    }

    readings.value.unshift(reading)

    // Clear form
    newReading.value.systolic = ''
    newReading.value.diastolic = ''
    newReading.value.heartRate = ''
    newReading.value.date = new Date().toISOString().split('T')[0]
  } catch (error) {
    console.error('Error adding reading:', error)
    errorMessage.value = 'Error saving reading: ' + error.message
  } finally {
    isLoading.value = false
  }
}

const deleteReading = async (id) => {
  if (!confirm('Are you sure you want to delete this reading?')) {
    return
  }

  try {
    const { error } = await supabase
      .from('blood_pressure_readings')
      .delete()
      .eq('id', id)

    if (error) throw error

    readings.value = readings.value.filter(r => r.id !== id)
  } catch (error) {
    console.error('Error deleting reading:', error)
    errorMessage.value = 'Error deleting reading: ' + error.message
  }
}

const exportToCSV = () => {
  if (readings.value.length === 0) {
    alert('No data to export')
    return
  }

  const headers = ['Date', 'Systolic', 'Diastolic', 'Heart Rate', 'BP Category']
  const csvContent = [
    headers.join(','),
    ...readings.value.map(r => [
      r.date,
      r.systolic,
      r.diastolic,
      r.heartRate,
      r.category
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'blood_pressure_readings.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

onMounted(() => {
  loadReadings()
})
</script>

<style scoped>
/* BP Category Color Coding */
.bp-normal {
  background-color: #d4edda;
  color: #155724;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
}

.bp-elevated {
  background-color: #fff3cd;
  color: #856404;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
}

.bp-stage1 {
  background-color: #ffe5cc;
  color: #cc5500;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
}

.bp-stage2 {
  background-color: #f8d7da;
  color: #721c24;
  font-weight: 600;
  padding: 8px;
  border-radius: 4px;
}

.bp-crisis {
  background-color: #dc3545;
  color: #ffffff;
  font-weight: 700;
  padding: 8px;
  border-radius: 4px;
}
</style>
