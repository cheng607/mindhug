export interface dailyTrend {
    date: string
    sessionCount: number
    userCount: number
}

export interface consultationStats {
    avgDurationMinutes: number
    dailyTrend: dailyTrend[]
    totalSessions: number
}

export interface gridDataType {
    x: number
    y: number
    value: number
    avgMoodScore: number
    dominantEmotion: string
}
export interface emotionHeatmap {
    dateRange: string
    emotionDistribution: []
    gridData: gridDataType[]
    peakEmotionTime: string
}
export interface emotionTrend {
    avgMoodScore: number
    date: string
    dominantEmotion: string
    negativeRatio: number
    positiveRatio: number
    recordCount: number
}

export interface systemOverview {
    activeUsers: number
    avgMoodScore: number
    todayNewDiaries: number
    todayNewSessions: number
    todayNewUsers: number
    totalDiaries: number
    totalSessions: number
    totalUsers: number
}
export interface userActivity {
    activeUsers: number
    consultationUsers: number
    date: string
    diaryUsers: number
    newUsers: number
}

export interface analyticsDataType {
    consultationStats: consultationStats
    emotionHeatmap: emotionHeatmap
    emotionTrend: emotionTrend[]
    systemOverview: systemOverview
    userActivity: userActivity[]

}   