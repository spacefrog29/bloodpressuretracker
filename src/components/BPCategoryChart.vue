<template>
  <div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="loading">
      Loading chart data...
    </div>

    <div v-else-if="readings.length === 0" class="no-data">
      No readings available to display. Add some readings first!
    </div>

    <div v-else class="chart-container">
      <h2>BP Category Trend (Last {{ readings.length }} Readings)</h2>
      <Line :data="chartData" :options="chartOptions" />

      <div class="legend">
        <h3>Category Legend:</h3>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-color bp-normal"></span>
            <span>Normal (&lt;120/&lt;80)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color bp-elevated"></span>
            <span>Elevated (&lt;130/&lt;80)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color bp-stage1"></span>
            <span>Stage 1 High (&lt;140/&lt;90)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color bp-stage2"></span>
            <span>Stage 2 High (&lt;180/&lt;120)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color bp-crisis"></span>
            <span>Crisis (≥180/≥120)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { supabase } from '../services/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const readings = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const getBPCategory = (systolic, diastolic) => {
  if (systolic < 120 && diastolic < 80) return 'Normal'
  if (systolic < 130 && diastolic < 80) return 'Elevated'
  if (systolic < 140 || diastolic < 90) return 'Stage 1 High'
  if (systolic < 180 || diastolic < 120) return 'Stage 2 High'
  return 'Crisis'
}

const getCategoryNumericValue = (category) => {
  const valueMap = {
    'Normal': 1,
    'Elevated': 2,
    'Stage 1 High': 3,
    'Stage 2 High': 4,
    'Crisis': 5
  }
  return valueMap[category] || 0
}

const getCategoryColor = (category) => {
  const colorMap = {
    'Normal': '#28a745',
    'Elevated': '#ffc107',
    'Stage 1 High': '#ff8c00',
    'Stage 2 High': '#dc3545',
    'Crisis': '#8b0000'
  }
  return colorMap[category] || '#666'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB')
}

const chartData = computed(() => {
  if (readings.value.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Reverse to show chronologically (oldest to newest)
  const chronologicalReadings = [...readings.value].reverse()

  return {
    labels: chronologicalReadings.map(r => formatDate(r.date)),
    datasets: [{
      label: 'BP Category',
      data: chronologicalReadings.map(r => getCategoryNumericValue(r.category)),
      borderColor: '#4285f4',
      backgroundColor: 'rgba(66, 133, 244, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: chronologicalReadings.map(r => getCategoryColor(r.category)),
      pointBorderColor: chronologicalReadings.map(r => getCategoryColor(r.category)),
      pointRadius: 6,
      pointHoverRadius: 8,
      tension: 0.3
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const index = context.dataIndex
          const reading = [...readings.value].reverse()[index]
          return [
            `Category: ${reading.category}`,
            `Systolic: ${reading.systolic}`,
            `Diastolic: ${reading.diastolic}`,
            `Heart Rate: ${reading.heartRate}`
          ]
        }
      }
    }
  },
  scales: {
    y: {
      min: 0,
      max: 6,
      ticks: {
        stepSize: 1,
        callback: (value) => {
          const categoryMap = {
            1: 'Normal',
            2: 'Elevated',
            3: 'Stage 1',
            4: 'Stage 2',
            5: 'Crisis'
          }
          return categoryMap[value] || ''
        }
      },
      grid: {
        color: (context) => {
          const value = context.tick.value
          if (value === 1) return 'rgba(40, 167, 69, 0.2)'
          if (value === 2) return 'rgba(255, 193, 7, 0.2)'
          if (value === 3) return 'rgba(255, 140, 0, 0.2)'
          if (value === 4) return 'rgba(220, 53, 69, 0.2)'
          if (value === 5) return 'rgba(139, 0, 0, 0.2)'
          return 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45
      }
    }
  }
}

const loadReadings = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data, error } = await supabase
      .from('blood_pressure_readings')
      .select('*')
      .order('reading_date', { ascending: false })
      .limit(30)

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

onMounted(() => {
  loadReadings()
})
</script>

<style scoped>
.chart-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.chart-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 20px;
}

.legend {
  margin-top: 40px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.legend h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: inline-block;
}

.bp-normal {
  background-color: #28a745;
}

.bp-elevated {
  background-color: #ffc107;
}

.bp-stage1 {
  background-color: #ff8c00;
}

.bp-stage2 {
  background-color: #dc3545;
}

.bp-crisis {
  background-color: #8b0000;
}

/* Make the chart responsive */
:deep(canvas) {
  max-height: 500px !important;
}
</style>
