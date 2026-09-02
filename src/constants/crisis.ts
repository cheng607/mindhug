/** 危机干预固定求助资源（与后端 core/crisis.py 保持一致） */
export const CRISIS_HOTLINE = '400-161-9995'
export const CRISIS_HOTLINE_LABEL = '全国心理援助热线'

export const CRISIS_RESOURCES = [
    { name: CRISIS_HOTLINE_LABEL, phone: CRISIS_HOTLINE, available: '24小时' },
    { name: '北京心理危机研究与干预中心', phone: '010-82951332', available: '24小时' },
    { name: '生命热线', phone: '400-161-9995', available: '24小时' },
] as const

export const AI_DISCLAIMER =
    'MindHug AI 对话仅用于情绪倾诉与心理科普参考，不能替代专业心理咨询或紧急医疗救助。'
