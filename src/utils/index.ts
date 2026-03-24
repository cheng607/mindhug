// 时间格式化函数
export const formatDate = (dateString: string): string => {
    // 先把输入的字符串转为数字（秒/分钟？根据你的原始逻辑，这里按分钟处理）
    const totalMinutes = parseInt(dateString);
    // 处理非数字的边界情况
    if (isNaN(totalMinutes) || totalMinutes < 0) {
        return '0分钟';
    }

    // 计算各单位的值
    const days = Math.floor(totalMinutes / (60 * 24)); // 总分钟数 / 一天的分钟数
    const remainingMinutesAfterDays = totalMinutes % (60 * 24);
    const hours = Math.floor(remainingMinutesAfterDays / 60); // 剩余分钟数 / 60 = 小时
    const minutes = remainingMinutesAfterDays % 60; // 最终剩余的分钟数

    // 构建格式化的数组（只保留非0的单位）
    const parts: string[] = [];
    if (days > 0) {
        parts.push(`${days}天`);
    }
    if (hours > 0) {
        parts.push(`${hours}小时`);
    }
    // 分钟特殊处理：如果前面没有天/小时，或者分钟数>0，都要显示
    if (minutes > 0 || parts.length === 0) {
        parts.push(`${minutes}分钟`);
    }

    // 拼接所有非0部分
    return parts.join('');
};