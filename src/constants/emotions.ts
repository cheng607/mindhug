export const EMOTION_LABEL_MAP: Record<string, string> = {
    happy: '开心',
    calm: '平静',
    anxious: '焦虑',
    sad: '悲伤',
    excited: '兴奋',
    tired: '疲惫',
    surprised: '惊讶',
    confused: '困惑',
}

export const EMOTION_TAG_COLORS: Record<string, string> = {
    危机: 'red',
    焦虑: 'orange',
    抑郁: 'purple',
    难过: 'blue',
    压力: 'volcano',
    烦躁: 'magenta',
    孤独: 'geekblue',
    疲惫: 'default',
}

export function getEmotionLabel(key?: string) {
    if (!key) return '—'
    return EMOTION_LABEL_MAP[key] || key
}

export function getEmotionTagColor(tag?: string) {
    if (!tag) return 'default'
    return EMOTION_TAG_COLORS[tag] || 'green'
}
