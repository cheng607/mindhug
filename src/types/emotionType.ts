export interface diaryParamType {
    currentPage?: string;
    dominantEmotion?: string;
    maxMoodScore?: string;
    minMoodScore?: string;
    size?: string;
    userId?: string;
}
export interface diaryType {
    aiAnalysisStatus: string
    aiAnalysisUpdatedAt: string
    aiEmotionAnalysis: string
    contentLength: number
    createdAt: string
    diaryContent: string
    diaryContentPreview: string
    diaryDate: string
    dominantEmotion: string
    emotionTriggers: string
    hasAiEmotionAnalysis: boolean
    id: number
    moodScore: number
    nickname: string
    sleepQuality: number
    stressLevel: number
    updatedAt: string
    userId: number
    username: string
}
export interface diaryData {
    current: number,
    pages: number,
    records: diaryType[],
    size: number,
    total: number
}

export interface aiDataType {
    primaryEmotion: string,
    emotionScore: number,
    isNegative: boolean,
    riskLevel: number,
    keywords: string[],
    suggestion: string,
    icon: string,
    label: string,
    riskDescription: string,
    improvementSuggestions: string[],
    timestamp: number
}

export interface diaryFormData {
    diaryContent: string;
    diaryDate: string;
    dominantEmotion: string;
    emotionTriggers: string;
    moodScore: number;
    sleepQuality: number;
    stressLevel: number;
}
