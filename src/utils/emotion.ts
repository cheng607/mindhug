import type { aiDataType } from '../types/emotionType'

const DEFAULT_AI_DATA: aiDataType = {
    primaryEmotion: '无分析数据',
    emotionScore: 0,
    isNegative: false,
    riskLevel: 0,
    keywords: [],
    suggestion: '',
    icon: '',
    label: '',
    riskDescription: '',
    improvementSuggestions: [],
    timestamp: 0,
}

/** 安全解析日记 AI 分析 JSON 字符串 */
export function parseAiEmotionAnalysis(raw: string | null | undefined): aiDataType {
    if (!raw || raw.trim() === '') return DEFAULT_AI_DATA
    try {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'object' && parsed !== null) {
            return { ...DEFAULT_AI_DATA, ...parsed }
        }
    } catch {
        // 非 JSON 格式，忽略
    }
    return DEFAULT_AI_DATA
}
