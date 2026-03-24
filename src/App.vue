<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MonthData,
  CalculationResult,
  calculateFullYear,
  calculateSavingsComparison,
  TIER_PRICES,
  PEAK_HOURS,
  VALLEY_HOURS,
  BREAKEVEN_PEAK_RATIO,
  BILLING_CYCLE_START_MONTH,
  isHeatingSeason,
  getMonthName,
  getTierName
} from './utils/calculator'

type TabType = 'intro' | 'data-input' | 'manual-input' | 'report'

const activeTab = ref<TabType>('intro')
const startYear = ref(2024)
const monthsData = ref<MonthData[]>([])
const calculationResult = ref<CalculationResult | null>(null)

const manualPeakRatio = ref(30)
const manualTotalUsage = ref(300)
const manualCumulative = ref(0)
const manualHeatingSeason = ref(false)

const manualResult = computed(() => {
  const tier = manualHeatingSeason.value ? 1 : 
    manualCumulative.value < 1260 ? 1 :
    manualCumulative.value < 2450 ? 2 : 3
  return calculateSavingsComparison(manualTotalUsage.value, manualPeakRatio.value / 100, tier)
})

function printReport() {
  window.print()
}

function initMonthsData() {
  const data: MonthData[] = []
  for (let i = 0; i < 12; i++) {
    const month = i < 6 ? i + 7 : i - 5
    const year = i < 6 ? startYear.value : startYear.value + 1
    data.push({
      month,
      year,
      usage: 0,
      cost: 0
    })
  }
  monthsData.value = data
}

function calculate() {
  if (monthsData.value.length === 0) {
    initMonthsData()
  }
  calculationResult.value = calculateFullYear(monthsData.value)
  activeTab.value = 'report'
}

function resetData() {
  monthsData.value = []
  calculationResult.value = null
  initMonthsData()
}

function loadSampleData() {
  monthsData.value = [
    { month: 7, year: startYear.value, usage: 589, cost: 268.20 },
    { month: 8, year: startYear.value, usage: 653, cost: 285.29 },
    { month: 9, year: startYear.value, usage: 396, cost: 196.28 },
    { month: 10, year: startYear.value, usage: 268, cost: 130.60 },
    { month: 11, year: startYear.value, usage: 340, cost: 149.92 },
    { month: 12, year: startYear.value, usage: 311, cost: 137.77 },
    { month: 1, year: startYear.value + 1, usage: 228, cost: 97.76 },
    { month: 2, year: startYear.value + 1, usage: 180, cost: 76.69 },
    { month: 3, year: startYear.value + 1, usage: 262, cost: 115.41 },
    { month: 4, year: startYear.value + 1, usage: 159, cost: 72.13 },
    { month: 5, year: startYear.value + 1, usage: 294, cost: 139.15 },
    { month: 6, year: startYear.value + 1, usage: 376, cost: 180.22 }
  ]
}

initMonthsData()

const sortedMonths = computed(() => {
  return [...monthsData.value].sort((a, b) => {
    const cycleOrderA = a.month >= BILLING_CYCLE_START_MONTH ? a.month - 12 : a.month
    const cycleOrderB = b.month >= BILLING_CYCLE_START_MONTH ? b.month - 12 : b.month
    return cycleOrderA - cycleOrderB
  })
})
</script>

<template>
  <div class="container">
    <header class="header">
      <h1>⚡ 陕西省居民峰谷电费测算工具</h1>
      <p>支持阶梯电价、峰谷分时、采暖季政策计算 · 帮您分析用电成本与节省方案</p>
    </header>

    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'intro' }"
        @click="activeTab = 'intro'"
      >
        📖 使用说明
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'data-input' }"
        @click="activeTab = 'data-input'"
      >
        📊 数据推算模式
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'manual-input' }"
        @click="activeTab = 'manual-input'"
      >
        🔧 手动计算模式
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'report' }"
        @click="activeTab = 'report'"
        :disabled="!calculationResult"
      >
        📋 查看报告
      </button>
    </div>

    <div v-if="activeTab === 'intro'" class="card">
      <h2 class="card-title">工具说明</h2>
      
      <div class="info-box">
        <h4>🎯 适用场景</h4>
        <ul>
          <li><strong>已开通峰谷电的用户</strong>：有完整周期（7月1日-次年6月30日）的每月用电量和电费数据，可推算出每月峰谷电用量</li>
          <li><strong>未开通峰谷电的用户</strong>：可使用手动计算模式，自行估算峰谷比例，模拟开通后的费用变化</li>
        </ul>
      </div>

      <div class="card" style="margin-top: 20px;">
        <h3 class="card-title">陕西省居民电价规则</h3>
        
        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">📅 计费周期</h4>
        <p>每年 <strong>7月1日</strong> 至 <strong>次年6月30日</strong> 为一个完整阶梯周期</p>

        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">⚡ 峰谷时段</h4>
        <ul style="margin-left: 20px; color: var(--text-secondary);">
          <li><strong class="highlight-peak">峰段</strong>：{{ PEAK_HOURS }}（12小时）</li>
          <li><strong class="highlight-valley">谷段</strong>：{{ VALLEY_HOURS }}（12小时）</li>
        </ul>

        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">💰 阶梯电价表</h4>
        <table class="price-table">
          <thead>
            <tr>
              <th>档位</th>
              <th>年用电量</th>
              <th>基准价</th>
              <th>峰电价</th>
              <th>谷电价</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tier in TIER_PRICES" :key="tier.tier">
              <td><span :class="['tier-badge', `tier-${tier.tier}`]">{{ tier.name }}</span></td>
              <td>{{ tier.maxKwh ? `${tier.minKwh} - ${tier.maxKwh}度` : `${tier.minKwh}度以上` }}</td>
              <td>{{ tier.basePrice.toFixed(4) }}元</td>
              <td class="highlight-peak">{{ tier.peakPrice.toFixed(4) }}元</td>
              <td class="highlight-valley">{{ tier.valleyPrice.toFixed(4) }}元</td>
            </tr>
          </tbody>
        </table>

        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">🔥 采暖季政策（11月-次年3月）</h4>
        <ul style="margin-left: 20px; color: var(--text-secondary);">
          <li>强制按<strong>第一档</strong>计费，无论累计多少度</li>
          <li>用电量<strong>不计入</strong>年度阶梯累计（冻结）</li>
          <li>谷电价固定为 <strong class="highlight-valley">0.2983元/度</strong>，不受高档位影响</li>
        </ul>

        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">💡 盈亏平衡点</h4>
        <p>峰电占比低于 <strong>{{ (BREAKEVEN_PEAK_RATIO * 100).toFixed(0) }}%</strong> 时，开通峰谷电就是合算的。</p>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 8px;">
          绝大多数家庭夜间都有用电（热水器、空调、充电等），峰电占比远低于80%，因此开通峰谷电通常能节省电费。
        </p>
      </div>
    </div>

    <div v-if="activeTab === 'data-input'" class="card">
      <h2 class="card-title">数据推算模式</h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        输入您的每月用电量和电费数据，系统将自动推算出每月的峰谷电用量。
      </p>

      <div class="form-row" style="margin-bottom: 20px;">
        <div class="form-group">
          <label class="form-label">计费周期起始年份</label>
          <input 
            type="number" 
            v-model="startYear" 
            class="form-input"
            @change="initMonthsData"
          />
        </div>
      </div>

      <div class="btn-group" style="margin-bottom: 20px;">
        <button class="btn btn-outline" @click="loadSampleData">载入示例数据</button>
        <button class="btn btn-outline" @click="resetData">清空数据</button>
      </div>

      <div class="month-input-grid">
        <div 
          v-for="(m, index) in sortedMonths" 
          :key="index"
          class="month-input-card"
          :class="{ heating: isHeatingSeason(m.month) }"
        >
          <div class="month-header">
            <span class="month-name">{{ m.year }}年{{ getMonthName(m.month) }}</span>
            <span v-if="isHeatingSeason(m.month)" class="heating-badge">采暖季</span>
          </div>
          <div class="form-group">
            <label class="form-label">用电量（度）</label>
            <input 
              type="number" 
              v-model.number="m.usage" 
              class="form-input"
              placeholder="用电量"
              step="0.01"
            />
          </div>
          <div class="form-group">
            <label class="form-label">电费（元）</label>
            <input 
              type="number" 
              v-model.number="m.cost" 
              class="form-input"
              placeholder="电费"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn btn-primary" @click="calculate">开始计算</button>
      </div>
    </div>

    <div v-if="activeTab === 'manual-input'" class="card">
      <h2 class="card-title">手动计算模式</h2>
      <p style="color: var(--text-secondary); margin-bottom: 20px;">
        适用于未开通峰谷电或想模拟不同峰谷比例的用户。请根据您的用电习惯估算峰谷比例。
      </p>

      <div class="info-box">
        <h4>💡 如何估算峰谷比例？</h4>
        <ul>
          <li><strong>峰段时间（{{ PEAK_HOURS }}）</strong>：白天的常规用电</li>
          <li><strong>谷段时间（{{ VALLEY_HOURS }}）</strong>：夜间用电，如热水器、洗衣机、空调、电动车充电等</li>
          <li>如果夜间用电较多，峰电比例可能在 20%-40%</li>
          <li>如果主要白天用电，峰电比例可能在 60%-80%</li>
        </ul>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">峰电比例（%）</label>
          <div class="slider-container">
            <input 
              type="range" 
              v-model="manualPeakRatio" 
              class="slider"
              min="0"
              max="100"
              step="1"
            />
            <div class="slider-value">{{ manualPeakRatio }}%</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">总用电量（度）</label>
          <input 
            type="number" 
            v-model.number="manualTotalUsage" 
            class="form-input"
            step="0.01"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">当前累计用电量（度）</label>
          <input 
            type="number" 
            v-model.number="manualCumulative" 
            class="form-input"
            step="0.01"
          />
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            用于确定阶梯档位：0-1260度为第一档，1261-2450度为第二档，2451度以上为第三档
          </p>
        </div>
        <div class="form-group">
          <label class="form-label">是否采暖季</label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" v-model="manualHeatingSeason" />
            <span>是采暖季（11月-次年3月）</span>
          </label>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            采暖季强制按第一档计费，且不计入累计
          </p>
        </div>
      </div>

      <div class="card" style="margin-top: 20px; background: var(--bg-color);">
        <h3 class="card-title">计算结果</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ manualResult.withPeakValley.toFixed(2) }}元</div>
            <div class="stat-label">开通峰谷电费用</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ manualResult.withoutPeakValley.toFixed(2) }}元</div>
            <div class="stat-label">不开峰谷电费用</div>
          </div>
          <div class="stat-card">
            <div class="stat-value success">{{ manualResult.savings.toFixed(2) }}元</div>
            <div class="stat-label">{{ manualResult.savings >= 0 ? '节省' : '多付' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" :class="{ success: manualResult.savings > 0, warning: manualResult.savings < 0 }">
              {{ manualResult.savings >= 0 ? '✓ 建议开通' : '✗ 不建议' }}
            </div>
            <div class="stat-label">建议</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'report' && calculationResult" class="report-section">
      <div class="report-header">
        <h2>📋 电费分析报告</h2>
        <p>{{ startYear }}年7月 - {{ startYear + 1 }}年6月 计费周期</p>
      </div>

      <div class="card">
        <h3 class="card-title">总体统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ calculationResult.totalUsage.toFixed(0) }}</div>
            <div class="stat-label">总用电量（度）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ calculationResult.totalCost.toFixed(2) }}</div>
            <div class="stat-label">总电费（元）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value success">{{ calculationResult.totalSavings.toFixed(2) }}</div>
            <div class="stat-label">节省金额（元）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value success">{{ calculationResult.savingsRate.toFixed(1) }}%</div>
            <div class="stat-label">节省比例</div>
          </div>
        </div>

        <div class="stats-grid" style="margin-top: 16px;">
          <div class="stat-card">
            <div class="stat-value warning">{{ calculationResult.totalPeakUsage.toFixed(0) }}</div>
            <div class="stat-label">峰电用量（度）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value success">{{ calculationResult.totalValleyUsage.toFixed(0) }}</div>
            <div class="stat-label">谷电用量（度）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ calculationResult.averagePeakRatio.toFixed(1) }}%</div>
            <div class="stat-label">平均峰电比例</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: calculationResult.averagePeakRatio + '%' }"></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value" :class="{ success: calculationResult.averagePeakRatio < 80 }">
              {{ calculationResult.averagePeakRatio < 80 ? '✓ 合算' : '✗ 需优化' }}
            </div>
            <div class="stat-label">峰谷电评估</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">阶梯档位分布</h3>
        <table>
          <thead>
            <tr>
              <th>档位</th>
              <th>用电量（度）</th>
              <th>电费（元）</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tier in calculationResult.tierDistribution" :key="tier.tier">
              <td><span :class="['tier-badge', `tier-${tier.tier}`]">{{ getTierName(tier.tier) }}</span></td>
              <td>{{ tier.usage.toFixed(0) }}</td>
              <td>{{ tier.cost.toFixed(2) }}</td>
              <td>{{ ((tier.usage / calculationResult.totalUsage) * 100).toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 class="card-title">月度明细</h3>
        <div style="overflow-x: auto;">
          <table>
            <thead>
              <tr>
                <th>月份</th>
                <th>用电量</th>
                <th>电费</th>
                <th>峰电</th>
                <th>谷电</th>
                <th>峰电比例</th>
                <th>档位</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="m in calculationResult.months" 
                :key="`${m.year}-${m.month}`"
                :class="{ 'heating-season': m.isHeatingSeason, 'cross-tier': m.isCrossTier }"
              >
                <td>{{ m.year }}年{{ getMonthName(m.month) }}</td>
                <td>{{ m.usage.toFixed(0) }}度</td>
                <td>{{ m.cost.toFixed(2) }}元</td>
                <td class="highlight-peak">{{ m.peakUsage.toFixed(1) }}度</td>
                <td class="highlight-valley">{{ m.valleyUsage.toFixed(1) }}度</td>
                <td>
                  {{ m.peakRatio.toFixed(1) }}%
                  <div class="progress-bar" style="width: 60px; display: inline-block; vertical-align: middle;">
                    <div class="progress-fill" :style="{ width: m.peakRatio + '%' }"></div>
                  </div>
                </td>
                <td><span :class="['tier-badge', `tier-${m.tier}`]">{{ getTierName(m.tier) }}</span></td>
                <td>
                  <span v-if="m.isHeatingSeason" style="color: var(--warning-color);">采暖季</span>
                  <span v-if="m.isCrossTier" style="color: var(--danger-color);">跨档月</span>
                  <span v-if="!m.isHeatingSeason && !m.isCrossTier">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">分析与建议</h3>
        <div class="info-box">
          <h4>📊 数据分析</h4>
          <ul>
            <li>您的平均峰电比例为 <strong>{{ calculationResult.averagePeakRatio.toFixed(1) }}%</strong></li>
            <li>盈亏平衡点为 <strong>80%</strong>，您的峰电比例{{ calculationResult.averagePeakRatio < 80 ? '低于' : '高于' }}平衡点</li>
            <li>开通峰谷电后，本周期共节省 <strong>{{ calculationResult.totalSavings.toFixed(2) }}元</strong>，节省率 <strong>{{ calculationResult.savingsRate.toFixed(1) }}%</strong></li>
          </ul>
        </div>
        
        <div class="info-box" style="border-left-color: var(--success-color);">
          <h4 style="color: var(--success-color);">💡 节电建议</h4>
          <ul>
            <li>将大功率电器（洗衣机、洗碗机、热水器、电动车充电等）尽量安排在 <strong>20:00 之后</strong> 使用</li>
            <li>采暖季（11月-次年3月）谷电价格最低（0.2983元/度），可充分利用</li>
            <li>关注阶梯升档节点，在进入高档位前适当控制用电</li>
          </ul>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn btn-outline" @click="activeTab = 'data-input'">返回修改数据</button>
        <button class="btn btn-success" @click="printReport">打印报告</button>
      </div>
    </div>

    <footer class="footer">
      <p>陕西省居民峰谷电费测算工具 · 数据来源：国网陕西电力</p>
      <p>如电价政策有调整请以官方最新通知为准</p>
    </footer>
  </div>
</template>
