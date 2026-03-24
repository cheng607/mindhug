import { useEffect, useRef, useState, useCallback } from "react"
import { getAnalysis } from "../apis/analydata"
import Icon1 from "../assets/icon1.png"
import Icon2 from "../assets/icon2.png"
import Icon3 from "../assets/icon3.png"
import Icon4 from "../assets/icon4.png"
import type { analyticsDataType } from "../types/analyType"
import * as echarts from 'echarts';
import { Divider } from "antd"
import { formatDate } from "../utils"

export default function DashBoard() {
    const [data, setData] = useState<analyticsDataType>()
    const emotionChartRef = useRef<HTMLDivElement>(null);
    const emotionChartInstance = useRef<echarts.ECharts | null>(null);
    const sessionChartRef = useRef<HTMLDivElement>(null)
    const sessionChartInstance = useRef<echarts.ECharts | null>(null);
    const activeChartRef = useRef<HTMLDivElement>(null)
    const activeChartInstance = useRef<echarts.ECharts | null>(null);
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const res = await getAnalysis()
                setData(res.data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchAnalysis()
    }, [])

    // 初始化情绪图表
    const initEmotionChart = useCallback(() => {
        if (emotionChartInstance.current) {
            emotionChartInstance.current.dispose();
        }
        emotionChartInstance.current = echarts.init(emotionChartRef.current);

        const option = {
            title: {
                text: '情绪趋势分析',
                textStyle: {
                    color: '#2d3436',
                    fontSize: 16,
                    fontWeight: 600
                },
                left: 'center',
                top: 10
            },
            xAxis: {
                type: 'category',
                data: data?.emotionTrend.map(item => item.date),
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            },
            yAxis: [{
                type: 'value',
                name: '情绪评分',
                position: 'left',
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            }, {
                type: 'value',
                name: '记录数量',
                position: 'right',
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            }],
            grid: {
                left: '3%',
                right: '4%',
                top: 80,
                bottom: 20
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['平均情绪得分', '记录数量'],
                top: 40
            },
            series: [
                {
                    data: data?.emotionTrend.map(item => item.avgMoodScore),
                    type: 'line',
                    name: '平均情绪得分',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: '#fab1a0'
                    },
                    itemStyle: {
                        color: '#fab1a0'
                    }
                },
                {
                    data: data?.emotionTrend.map(item => item.recordCount),
                    type: 'line',
                    name: '记录数量',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: '#2d3436'
                    },
                    itemStyle: {
                        color: '#2d3436'
                    }
                }
            ]
        }

        emotionChartInstance.current.setOption(option);
    }, [data])

    // 初始化咨询会话图表
    const initSessionChart = useCallback(() => {
        if (sessionChartInstance.current) {
            sessionChartInstance.current.dispose();
        }
        sessionChartInstance.current = echarts.init(sessionChartRef.current);

        const option = {
            title: {
                text: '咨询活动统计',
                textStyle: {
                    color: '#2d3436',
                    fontSize: 16,
                    fontWeight: 600
                },
                left: 'center',
                top: 10
            },
            xAxis: {
                type: 'category',
                data: data?.consultationStats.dailyTrend.map(item => item.date),
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            },
            yAxis: [{
                type: 'value',
                position: 'left',
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            }],
            grid: {
                left: '3%',
                right: '4%',
                top: 80,
                bottom: 20
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['会话数量', '参与用户数'],
                top: 40
            },
            series: [
                {
                    data: data?.consultationStats.dailyTrend.map(item => item.sessionCount),
                    type: 'bar',
                    name: '会话数量',
                    lineStyle: {
                        width: 3,
                        color: '#7FB2F9'
                    },
                    itemStyle: {
                        color: '#7FB2F9'
                    }
                },
                {
                    data: data?.consultationStats.dailyTrend.map(item => item.userCount),
                    type: 'bar',
                    name: '参与用户数',
                    lineStyle: {
                        width: 3,
                        color: '#EDB755'
                    },
                    itemStyle: {
                        color: '#EDB755'
                    }
                }
            ]
        }

        sessionChartInstance.current.setOption(option);
    }, [data])
    // 初始化用户活跃度图表
    const initActiveChart = useCallback(() => {
        if (activeChartInstance.current) {
            activeChartInstance.current.dispose();
        }
        activeChartInstance.current = echarts.init(activeChartRef.current);

        const option = {
            title: {
                text: '用户活跃度趋势',
                textStyle: {
                    color: '#2d3436',
                    fontSize: 16,
                    fontWeight: 600
                },
                left: 'center',
                top: 10
            },
            xAxis: {
                type: 'category',
                data: data?.userActivity.map(item => item.date),
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            },
            yAxis: [{
                type: 'value',
                position: 'left',
                axisLine: {
                    lineStyle: {
                        color: '#2d3436'
                    }
                }
            }],
            grid: {
                left: '3%',
                right: '4%',
                top: 80,
                bottom: 20
            },
            tooltip: {
                trigger: 'axis',
            },
            legend: {
                data: ['活跃用户', '新增用户', '日记用户', '咨询用户'],
                top: 40
            },
            series: [
                {
                    data: data?.userActivity.map(item => item.activeUsers),
                    type: 'line',
                    name: '活跃用户',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: '#B1ACE1'
                    },
                    itemStyle: {
                        color: '#B1ACE1'
                    }
                },
                {
                    data: data?.userActivity.map(item => item.newUsers),
                    type: 'line',
                    name: '新增用户',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: '#EDB755'
                    },
                    itemStyle: {
                        color: '#EDB755'
                    }
                },
                {
                    data: data?.userActivity.map(item => item.diaryUsers),
                    type: 'line',
                    name: '日记用户',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: '#8ECCBC'
                    },
                    itemStyle: {
                        color: '#8ECCBC'
                    }
                },
                {
                    data: data?.userActivity.map(item => item.consultationUsers),
                    type: 'line',
                    name: '咨询用户',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: '#E8B9AD'
                    },
                    itemStyle: {
                        color: '#E8B9AD'
                    }
                }
            ]
        }

        activeChartInstance.current.setOption(option);
    }, [data])

    const initchart = useCallback(() => {
        initEmotionChart();
        initSessionChart();
        initActiveChart();
    }, [initEmotionChart, initSessionChart, initActiveChart])

    useEffect(() => {
        if (!data || !emotionChartRef.current) return;
        initchart()

        // 组件卸载时清理图表
        return () => {
            if (emotionChartInstance.current) {
                emotionChartInstance.current.dispose();
                emotionChartInstance.current = null;
            }
        };
    }, [data, initchart])

    return (
        <>
            {/* 顶部卡片区域 */}
            <div className="flex items-center justify-around mb-5">
                <div className="flex w-60 shadow-md rounded-lg p-4 gap-4">
                    <img src={Icon1} alt="" />
                    <div>
                        <div className="text-gray-500">总用户数</div>
                        <div className="text-lg">{data?.systemOverview.totalUsers}</div>
                        <div className="text-gray-500 text-xs">活跃用户：{data?.systemOverview.activeUsers}</div>
                    </div>
                </div>
                <div className="flex w-60 shadow-md rounded-lg p-4 gap-4">
                    <img src={Icon2} alt="" />
                    <div>
                        <div className="text-gray-500">情绪日志</div>
                        <div className="text-lg">{data?.systemOverview.totalDiaries}</div>
                        <div className="text-gray-500 text-xs">今日新增：{data?.systemOverview.todayNewDiaries}</div>
                    </div>
                </div>
                <div className="flex w-60 shadow-md rounded-lg p-4 gap-4">
                    <img src={Icon3} alt="" />
                    <div>
                        <div className="text-gray-500">咨询会话</div>
                        <div className="text-lg">{data?.systemOverview.totalSessions}</div>
                        <div className="text-gray-500 text-xs">今日新增：{data?.systemOverview.todayNewSessions}</div>
                    </div>
                </div>
                <div className="flex w-60 shadow-md rounded-lg p-4 gap-4">
                    <img src={Icon4} alt="" />
                    <div>
                        <div className="text-gray-500">平均情绪</div>
                        <div className="text-lg">{data?.systemOverview.avgMoodScore}/10</div>
                        <div className="text-gray-500 text-xs">情绪健康指数</div>
                    </div>
                </div>
            </div>
            <div className="flex gap-5">
                <div className="w-1/2 shadow-lg rounded-lg p-4">
                    <div className="text-lg mb-3">趋势情绪分析</div>
                    <Divider size="small" />
                    <div className="w-full h-96" ref={emotionChartRef}></div>
                </div>
                <div className="w-1/2 shadow-lg rounded-lg p-4">
                    <div className="text-lg mb-3">咨询会话统计</div>
                    <Divider size="small" />
                    <div className="flex items-center justify-around my-3">
                        <div className="flex flex-col items-center">
                            <div className="text-gray-400">总会话数</div>
                            <div className="text-lg font-medium">{data?.consultationStats.totalSessions}</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-gray-400">平均时长</div>
                            <div className="text-lg font-medium">
                                {formatDate(data?.consultationStats.avgDurationMinutes.toString() || '0')}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-gray-400">活跃用户</div>
                            <div className="text-lg font-medium">{data?.systemOverview.activeUsers}</div>
                        </div>
                    </div>
                    <div className="w-full h-80" ref={sessionChartRef}></div>
                </div>
            </div>
            <div className="w-full shadow-lg rounded-lg p-4 my-4">
                <div className="text-lg mb-3">用户活跃度趋势</div>
                <Divider size="small" />
                <div className="w-full h-96" ref={activeChartRef}></div>
            </div>
        </>
    )
}
