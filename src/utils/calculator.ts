export interface TierPrice {
  tier: number
  name: string
  minKwh: number
  maxKwh: number | null
  basePrice: number
  peakPrice: number
  valleyPrice: number
}

export interface MonthData {
  month: number
  year: number
  usage: number
  cost: number
}

export interface MonthResult {
  month: number
  year: number
  usage: number
  cost: number
  peakUsage: number
  valleyUsage: number
  peakRatio: number
  tier: number
  isHeatingSeason: boolean
  isCrossTier: boolean
  crossTierDetails?: CrossTierDetail[]
  cumulativeBefore: number
  cumulativeAfter: number
  calculatedCost: number
  costDiff: number
}

export interface CrossTierDetail {
  tierFrom: number
  tierTo: number
  usageInLower: number
  usageInHigher: number
  boundaryKwh: number
}

export interface CalculationResult {
  months: MonthResult[]
  totalUsage: number
  totalCost: number
  totalPeakUsage: number
  totalValleyUsage: number
  averagePeakRatio: number
  totalSavings: number
  savingsRate: number
  tierDistribution: { tier: number; usage: number; cost: number }[]
}

export interface ManualInput {
  peakRatio: number
  totalUsage: number
}

export const TIER_PRICES: TierPrice[] = [
  {
    tier: 1,
    name: '第一档',
    minKwh: 0,
    maxKwh: 1260,
    basePrice: 0.4983,
    peakPrice: 0.5483,
    valleyPrice: 0.2983
  },
  {
    tier: 2,
    name: '第二档',
    minKwh: 1260,
    maxKwh: 2450,
    basePrice: 0.5483,
    peakPrice: 0.5983,
    valleyPrice: 0.3483
  },
  {
    tier: 3,
    name: '第三档',
    minKwh: 2450,
    maxKwh: null,
    basePrice: 0.7983,
    peakPrice: 0.8483,
    valleyPrice: 0.5983
  }
]

export const HEATING_SEASON_MONTHS = [11, 12, 1, 2, 3]

export const PEAK_PRICE_ADJUSTMENT = 0.05
export const VALLEY_PRICE_ADJUSTMENT = -0.20
export const PEAK_VALLEY_DIFF = 0.25

export const BILLING_CYCLE_START_MONTH = 7
export const BILLING_CYCLE_END_MONTH = 6

export const PEAK_HOURS = '8:00 - 20:00'
export const VALLEY_HOURS = '20:00 - 次日 8:00'

export const BREAKEVEN_PEAK_RATIO = 0.80

export function isHeatingSeason(month: number): boolean {
  return HEATING_SEASON_MONTHS.includes(month)
}

export function getTierByCumulative(cumulative: number): TierPrice {
  for (let i = TIER_PRICES.length - 1; i >= 0; i--) {
    if (cumulative > TIER_PRICES[i].minKwh) {
      return TIER_PRICES[i]
    }
  }
  return TIER_PRICES[0]
}

export function getTierByIndex(tier: number): TierPrice {
  return TIER_PRICES.find(t => t.tier === tier) || TIER_PRICES[0]
}

export function findCrossTierBoundary(cumulativeBefore: number, cumulativeAfter: number): number | null {
  for (const tier of TIER_PRICES) {
    if (tier.maxKwh !== null) {
      if (cumulativeBefore < tier.maxKwh && cumulativeAfter > tier.maxKwh) {
        return tier.maxKwh
      }
    }
  }
  return null
}

export function calculatePeakValleyFromTotal(
  totalUsage: number,
  totalCost: number,
  tierPrice: TierPrice
): { peakUsage: number; valleyUsage: number; peakRatio: number } {
  const { valleyPrice } = tierPrice
  
  const valleyCost = totalUsage * valleyPrice
  const costDiff = totalCost - valleyCost
  const peakRatio = costDiff / (totalUsage * PEAK_VALLEY_DIFF)
  
  const clampedPeakRatio = Math.max(0, Math.min(1, peakRatio))
  
  const peakUsage = totalUsage * clampedPeakRatio
  const valleyUsage = totalUsage * (1 - clampedPeakRatio)
  
  return {
    peakUsage: Math.round(peakUsage * 100) / 100,
    valleyUsage: Math.round(valleyUsage * 100) / 100,
    peakRatio: Math.round(clampedPeakRatio * 10000) / 100
  }
}

export function calculateCrossTierPeakValley(
  totalUsage: number,
  totalCost: number,
  cumulativeBefore: number,
  boundaryKwh: number,
  lowerTier: TierPrice,
  higherTier: TierPrice
): { peakUsage: number; valleyUsage: number; peakRatio: number } {
  const usageInLower = boundaryKwh - cumulativeBefore
  const usageInHigher = totalUsage - usageInLower
  
  const valleyCostLower = usageInLower * lowerTier.valleyPrice
  const valleyCostHigher = usageInHigher * higherTier.valleyPrice
  const totalValleyCost = valleyCostLower + valleyCostHigher
  
  const costDiff = totalCost - totalValleyCost
  const denominator = usageInLower * PEAK_VALLEY_DIFF + usageInHigher * PEAK_VALLEY_DIFF
  const peakRatio = costDiff / denominator
  
  const clampedPeakRatio = Math.max(0, Math.min(1, peakRatio))
  
  const peakUsage = totalUsage * clampedPeakRatio
  const valleyUsage = totalUsage * (1 - clampedPeakRatio)
  
  return {
    peakUsage: Math.round(peakUsage * 100) / 100,
    valleyUsage: Math.round(valleyUsage * 100) / 100,
    peakRatio: Math.round(clampedPeakRatio * 10000) / 100
  }
}

export function calculateMonthResult(
  monthData: MonthData,
  cumulativeBefore: number,
  isHeatingSeasonMonth: boolean
): MonthResult {
  const { month, year, usage, cost } = monthData
  
  if (isHeatingSeasonMonth) {
    const tierPrice = TIER_PRICES[0]
    const { peakUsage, valleyUsage, peakRatio } = calculatePeakValleyFromTotal(usage, cost, tierPrice)
    
    const calculatedCost = peakUsage * tierPrice.peakPrice + valleyUsage * tierPrice.valleyPrice
    
    return {
      month,
      year,
      usage,
      cost,
      peakUsage,
      valleyUsage,
      peakRatio,
      tier: 1,
      isHeatingSeason: true,
      isCrossTier: false,
      cumulativeBefore,
      cumulativeAfter: cumulativeBefore,
      calculatedCost: Math.round(calculatedCost * 100) / 100,
      costDiff: Math.round((cost - calculatedCost) * 100) / 100
    }
  }
  
  const cumulativeAfter = cumulativeBefore + usage
  const boundaryKwh = findCrossTierBoundary(cumulativeBefore, cumulativeAfter)
  
  if (boundaryKwh !== null) {
    const lowerTier = getTierByCumulative(cumulativeBefore)
    const higherTier = getTierByCumulative(boundaryKwh + 1)
    
    const usageInLower = boundaryKwh - cumulativeBefore
    const usageInHigher = usage - usageInLower
    
    const { peakUsage, valleyUsage, peakRatio } = calculateCrossTierPeakValley(
      usage,
      cost,
      cumulativeBefore,
      boundaryKwh,
      lowerTier,
      higherTier
    )
    
    const costLower = usageInLower * (peakRatio / 100 * lowerTier.peakPrice + (1 - peakRatio / 100) * lowerTier.valleyPrice)
    const costHigher = usageInHigher * (peakRatio / 100 * higherTier.peakPrice + (1 - peakRatio / 100) * higherTier.valleyPrice)
    const calculatedCost = costLower + costHigher
    
    return {
      month,
      year,
      usage,
      cost,
      peakUsage,
      valleyUsage,
      peakRatio,
      tier: higherTier.tier,
      isHeatingSeason: false,
      isCrossTier: true,
      crossTierDetails: [{
        tierFrom: lowerTier.tier,
        tierTo: higherTier.tier,
        usageInLower: Math.round(usageInLower * 100) / 100,
        usageInHigher: Math.round(usageInHigher * 100) / 100,
        boundaryKwh
      }],
      cumulativeBefore,
      cumulativeAfter,
      calculatedCost: Math.round(calculatedCost * 100) / 100,
      costDiff: Math.round((cost - calculatedCost) * 100) / 100
    }
  }
  
  const tierPrice = getTierByCumulative(cumulativeBefore)
  const { peakUsage, valleyUsage, peakRatio } = calculatePeakValleyFromTotal(usage, cost, tierPrice)
  
  const calculatedCost = peakUsage * tierPrice.peakPrice + valleyUsage * tierPrice.valleyPrice
  
  return {
    month,
    year,
    usage,
    cost,
    peakUsage,
    valleyUsage,
    peakRatio,
    tier: tierPrice.tier,
    isHeatingSeason: false,
    isCrossTier: false,
    cumulativeBefore,
    cumulativeAfter,
    calculatedCost: Math.round(calculatedCost * 100) / 100,
    costDiff: Math.round((cost - calculatedCost) * 100) / 100
  }
}

export function calculateFullYear(
  monthsData: MonthData[]
): CalculationResult {
  const sortedMonths = [...monthsData].sort((a, b) => {
    const cycleOrderA = a.month >= BILLING_CYCLE_START_MONTH ? a.month - 12 : a.month
    const cycleOrderB = b.month >= BILLING_CYCLE_START_MONTH ? b.month - 12 : b.month
    return cycleOrderA - cycleOrderB
  })
  
  let cumulativeNonHeating = 0
  const months: MonthResult[] = []
  
  for (const monthData of sortedMonths) {
    const heatingSeason = isHeatingSeason(monthData.month)
    
    const result = calculateMonthResult(monthData, cumulativeNonHeating, heatingSeason)
    months.push(result)
    
    if (!heatingSeason) {
      cumulativeNonHeating += monthData.usage
    }
  }
  
  const totalUsage = months.reduce((sum, m) => sum + m.usage, 0)
  const totalCost = months.reduce((sum, m) => sum + m.cost, 0)
  const totalPeakUsage = months.reduce((sum, m) => sum + m.peakUsage, 0)
  const totalValleyUsage = months.reduce((sum, m) => sum + m.valleyUsage, 0)
  const averagePeakRatio = (totalPeakUsage / totalUsage) * 100
  
  const costWithoutPeakValley = months.reduce((sum, m) => {
    const tier = getTierByIndex(m.tier)
    return sum + m.usage * tier.basePrice
  }, 0)
  
  const totalSavings = costWithoutPeakValley - totalCost
  const savingsRate = (totalSavings / costWithoutPeakValley) * 100
  
  const tierDistribution = [
    { tier: 1, usage: 0, cost: 0 },
    { tier: 2, usage: 0, cost: 0 },
    { tier: 3, usage: 0, cost: 0 }
  ]
  
  for (const m of months) {
    tierDistribution[m.tier - 1].usage += m.usage
    tierDistribution[m.tier - 1].cost += m.cost
  }
  
  return {
    months,
    totalUsage,
    totalCost,
    totalPeakUsage: Math.round(totalPeakUsage * 100) / 100,
    totalValleyUsage: Math.round(totalValleyUsage * 100) / 100,
    averagePeakRatio: Math.round(averagePeakRatio * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    savingsRate: Math.round(savingsRate * 100) / 100,
    tierDistribution: tierDistribution.map(t => ({
      ...t,
      usage: Math.round(t.usage * 100) / 100,
      cost: Math.round(t.cost * 100) / 100
    }))
  }
}

export function calculateManualInput(
  peakRatio: number,
  totalUsage: number,
  cumulativeBefore: number
): { peakUsage: number; valleyUsage: number; cost: number; tier: number } {
  const peakUsage = totalUsage * peakRatio
  const valleyUsage = totalUsage * (1 - peakRatio)
  
  const tierPrice = getTierByCumulative(cumulativeBefore)
  
  const cost = peakUsage * tierPrice.peakPrice + valleyUsage * tierPrice.valleyPrice
  
  return {
    peakUsage: Math.round(peakUsage * 100) / 100,
    valleyUsage: Math.round(valleyUsage * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    tier: tierPrice.tier
  }
}

export function calculateSavingsComparison(
  totalUsage: number,
  peakRatio: number,
  tier: number
): { withPeakValley: number; withoutPeakValley: number; savings: number } {
  const tierPrice = getTierByIndex(tier)
  const peakUsage = totalUsage * peakRatio
  const valleyUsage = totalUsage * (1 - peakRatio)
  
  const withPeakValley = peakUsage * tierPrice.peakPrice + valleyUsage * tierPrice.valleyPrice
  const withoutPeakValley = totalUsage * tierPrice.basePrice
  
  return {
    withPeakValley: Math.round(withPeakValley * 100) / 100,
    withoutPeakValley: Math.round(withoutPeakValley * 100) / 100,
    savings: Math.round((withoutPeakValley - withPeakValley) * 100) / 100
  }
}

export function getMonthName(month: number): string {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return names[month - 1] || ''
}

export function getTierName(tier: number): string {
  const tierPrice = getTierByIndex(tier)
  return tierPrice.name
}
