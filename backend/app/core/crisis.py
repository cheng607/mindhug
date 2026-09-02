"""危机干预固定资源与响应模板（全平台统一）。"""

CRISIS_HOTLINE = "400-161-9995"
CRISIS_HOTLINE_LABEL = "全国心理援助热线"

CRISIS_RESOURCES = [
    {"name": CRISIS_HOTLINE_LABEL, "phone": CRISIS_HOTLINE, "available": "24小时"},
    {"name": "北京心理危机研究与干预中心", "phone": "010-82951332", "available": "24小时"},
    {"name": "生命热线", "phone": "400-161-9995", "available": "24小时"},
]

CRISIS_RESPONSE_TEMPLATE = f"""我听到你现在非常痛苦，这一定很难熬。请你知道，**你值得被帮助，你并不孤单**。

如果你正处于危险中或有伤害自己的念头，请立即：
- 拨打 **{CRISIS_HOTLINE_LABEL} {CRISIS_HOTLINE}**
- 联系家人、朋友或同事陪伴
- 前往最近的心理卫生中心或医院急诊

我会一直在这里陪伴你。你愿意告诉我，现在最让你感到难以承受的是什么吗？"""

CRISIS_KEYWORDS = (
    "自杀",
    "不想活",
    "结束生命",
    "自残",
    "割腕",
    "伤害他人",
    "想死",
    "了结",
)
