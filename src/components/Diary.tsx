import {
    HeartOutlined, SmileOutlined, MehOutlined, FrownOutlined,
    FrownFilled, EyeInvisibleOutlined, BulbTwoTone,
    ExclamationCircleOutlined, QuestionCircleOutlined
} from '@ant-design/icons'
import { Form, Rate, Radio, Input, message, Table, Tag } from 'antd'
import type { RadioChangeEvent } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { addDiary, getMyDiaries } from '../apis/emotion'
import type { diaryType } from '../types/emotionType'

// 情绪选项配置
const emotions = [
    { value: 'happy', label: '开心', icon: <SmileOutlined className="text-yellow-400 text-4xl flex" /> },
    { value: 'calm', label: '平静', icon: <MehOutlined className="text-blue-400 text-4xl flex" /> },
    { value: 'anxious', label: '焦虑', icon: <FrownOutlined className="text-red-500 text-4xl flex" /> },
    { value: 'sad', label: '悲伤', icon: <FrownFilled className="text-gray-400 text-4xl flex" /> },
    { value: 'excited', label: '兴奋', icon: <BulbTwoTone className="text-green-500 text-4xl flex" /> },
    { value: 'tired', label: '疲惫', icon: <EyeInvisibleOutlined className="text-indigo-700 text-4xl flex" /> },
    { value: 'surprised', label: '惊讶', icon: <ExclamationCircleOutlined className="text-orange-500 text-4xl flex" /> },
    { value: 'confused', label: '困惑', icon: <QuestionCircleOutlined className="text-black text-4xl flex" /> },
]

import PageHero from './common/PageHero'
import { EMOTION_LABEL_MAP } from '../constants/emotions'

// 情绪评分描述映射
const rateDescriptions = ['极差', '低落不悦', '不太好', '一般', '平平', '还行', '不错', '开心', '很开心', '超棒']

export default function Diary() {
    const [form] = Form.useForm()
    const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
    const [currentRate, setCurrentRate] = useState<number>(0)
    const [history, setHistory] = useState<diaryType[]>([])
    const [historyTotal, setHistoryTotal] = useState(0)
    const [historyPage, setHistoryPage] = useState(1)
    const [historyPageSize, setHistoryPageSize] = useState(5)
    const [historyLoading, setHistoryLoading] = useState(false)

    const fetchHistory = useCallback(async (page = historyPage, size = historyPageSize) => {
        try {
            setHistoryLoading(true)
            const res = await getMyDiaries({ currentPage: page.toString(), size: size.toString() })
            setHistory(res.data.records || [])
            setHistoryTotal(res.data.total || 0)
        } catch (error) {
            console.error('获取日记历史失败', error)
        } finally {
            setHistoryLoading(false)
        }
    }, [historyPage, historyPageSize])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const onEmotionChange = (e: RadioChangeEvent) => {
        setSelectedEmotion(e.target.value)
        form.setFieldsValue({ dominantEmotion: e.target.value })
    }

    const onRateChange = (value: number) => {
        setCurrentRate(value)
        form.setFieldsValue({ moodScore: value })
    }

    const onFinish = async (values: { diaryContent: string; dominantEmotion: string; emotionTriggers: string; moodScore: number; sleepQuality: number; stressLevel: number }) => {
        try {
            const payload = {
                diaryContent: values.diaryContent,
                diaryDate: dayjs().format('YYYY-MM-DD'),
                dominantEmotion: values.dominantEmotion,
                emotionTriggers: values.emotionTriggers,
                moodScore: Number(values.moodScore),
                sleepQuality: Number(values.sleepQuality),
                stressLevel: Number(values.stressLevel),
            }
            await addDiary(payload)
            message.success('情绪日记提交成功！')
            form.resetFields()
            setSelectedEmotion(null)
            setCurrentRate(0)
            fetchHistory(1, historyPageSize)
            setHistoryPage(1)
        } catch (error) {
            message.error('提交失败，请稍后再试。')
            console.error('addDiary error', error)
        }
    }

    return (
        <div className="flex flex-1 flex-col bg-slate-50 pb-10">
            <PageHero
                icon={<HeartOutlined />}
                title="情绪日记"
                subtitle="记录心情，觉察情绪变化"
                gradient="from-[#98CD46] to-[#E0AD42]"
            />

            <Form
                form={form}
                className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6"
                initialValues={{
                    sleepQuality: 0,
                    stressLevel: 0,
                    moodScore: 0,
                    dominantEmotion: '',
                }}
                onFinish={onFinish}
            >
                {/* 今日情绪评分 */}
                <div className='rounded-xl bg-white p-4 shadow-sm sm:p-5'>
                    <div className='mb-3 text-xl font-bold sm:text-2xl'>今日情绪评分</div>
                    <div className='text-gray-500 mb-2'>您今天的整体情绪状态如何？（1-10分）</div>
                    <div className="flex items-center gap-2">
                        <Form.Item
                            name="moodScore"
                            noStyle
                            rules={[{ required: true, type: 'number', min: 1, max: 10, message: '请评分（1-10）' }]}
                        >
                            <Rate
                                count={10}
                                value={currentRate}
                                onChange={onRateChange}
                                className="text-yellow-400"
                            />
                        </Form.Item>
                        <span className="text-gray-600 ml-2">
                            {currentRate > 0 ? rateDescriptions[currentRate - 1] : ''}
                        </span>
                    </div>
                </div>

                {/* 主要情绪 */}
                <div className='rounded-xl bg-white p-4 shadow-sm sm:p-5'>
                    <div className='mb-4 text-xl font-bold sm:text-2xl'>主要情绪</div>
                    <Form.Item
                        name='dominantEmotion'
                        noStyle
                        rules={[{ required: true, message: '请选择主要情绪' }]}
                    >
                        <Radio.Group
                            value={selectedEmotion}
                            onChange={onEmotionChange}
                            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                        >
                            {emotions.map(emotion => (
                                <Radio.Button
                                    key={emotion.value}
                                    value={emotion.value}
                                    className={`flex h-20 flex-col items-center justify-center rounded-lg border-2 transition-all sm:h-24 ${selectedEmotion === emotion.value ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
                                >
                                    {emotion.icon}
                                    <span className="mt-2 text-lg font-medium text-gray-700">{emotion.label}</span>
                                </Radio.Button>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </div>

                {/* 情绪触发因素 */}
                <div className='bg-white p-5 rounded-lg'>
                    <div className='text-2xl font-bold mb-3'>情绪触发因素</div>
                    <div className='text-gray-500 mb-2'>今天什么事情影响了您的情绪？</div>
                    <Form.Item
                        name="emotionTriggers"
                        noStyle
                        rules={[{ required: true, message: '请输入情绪触发因素' }]}
                    >
                        <Input.TextArea
                            className='w-full h-24'
                            placeholder='今天什么事情影响了您的情绪？'
                            maxLength={1000}
                            showCount
                        />
                    </Form.Item>
                </div>

                {/* 今日感想 */}
                <div className='bg-white p-5 rounded-lg'>
                    <div className='text-2xl font-bold mb-3'>今日感想</div>
                    <div className='text-gray-500 mb-2'>写下您今天的想法、感受或发生的有趣事情...</div>
                    <Form.Item
                        name="diaryContent"
                        noStyle
                        rules={[{ required: true, message: '请输入今日感想' }]}
                    >
                        <Input.TextArea
                            className='w-full h-32'
                            placeholder='写下您今天的想法、感受或发生的有趣事情...'
                            maxLength={2000}
                            showCount
                        />
                    </Form.Item>
                </div>

                {/* 睡眠质量 & 压力水平 */}
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className='flex-1 rounded-xl bg-white p-4 shadow-sm sm:p-5'>
                        <div className='mb-3 text-xl font-bold sm:text-2xl'>睡眠质量</div>
                        <Form.Item
                            name="sleepQuality"
                            noStyle
                            rules={[{ required: true, message: '请选择睡眠质量' }]}
                        >
                            <select className='w-full rounded-lg border border-gray-200 p-3 focus:border-blue-500 focus:outline-none'>
                                <option value="0">请选择</option>
                                <option value="1">很差</option>
                                <option value="2">较差</option>
                                <option value="3">一般</option>
                                <option value="4">良好</option>
                                <option value="5">优秀</option>
                            </select>
                        </Form.Item>
                    </div>
                    <div className='flex-1 rounded-xl bg-white p-4 shadow-sm sm:p-5'>
                        <div className='mb-3 text-xl font-bold sm:text-2xl'>压力水平</div>
                        <Form.Item
                            name="stressLevel"
                            noStyle
                            rules={[{ required: true, message: '请选择压力水平' }]}
                        >
                            <select className='w-full rounded-lg border border-gray-200 p-3 focus:border-blue-500 focus:outline-none'>
                                <option value="0">请选择</option>
                                <option value="1">很低</option>
                                <option value="2">较低</option>
                                <option value="3">一般</option>
                                <option value="4">较高</option>
                                <option value="5">很高</option>
                            </select>
                        </Form.Item>
                    </div>
                </div>

                {/* 重置 & 提交按钮 */}
                <Form.Item>
                    <button
                        type="button"
                        onClick={() => form.resetFields()}
                        className='bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors mx-2'
                    >
                        重置
                    </button>
                    <button
                        type="submit"
                        className='bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors mx-2'
                    >
                        提交记录
                    </button>
                </Form.Item>
            </Form>

            <div className='mx-auto mb-10 w-full max-w-3xl px-4 sm:px-6'>
                <div className='mb-4 text-xl font-bold sm:text-2xl'>我的日记历史</div>
                <div className="overflow-x-auto rounded-xl bg-white p-2 shadow-sm sm:p-4">
                <Table
                    dataSource={history}
                    rowKey="id"
                    loading={historyLoading}
                    pagination={{
                        current: historyPage,
                        pageSize: historyPageSize,
                        total: historyTotal,
                        showSizeChanger: true,
                        showTotal: (t) => `共 ${t} 条`,
                        onChange: (page, size) => {
                            setHistoryPage(page)
                            setHistoryPageSize(size)
                            fetchHistory(page, size)
                        },
                    }}
                    locale={{ emptyText: '暂无日记记录' }}
                    columns={[
                        { title: '日期', dataIndex: 'diaryDate', key: 'diaryDate', width: 120 },
                        {
                            title: '情绪',
                            dataIndex: 'dominantEmotion',
                            key: 'dominantEmotion',
                            width: 80,
                            render: (val: string) => <Tag>{EMOTION_LABEL_MAP[val] || val}</Tag>,
                        },
                        {
                            title: '评分',
                            dataIndex: 'moodScore',
                            key: 'moodScore',
                            width: 160,
                            render: (val: number) => <Rate disabled value={val} count={10} />,
                        },
                        { title: '触发因素', dataIndex: 'emotionTriggers', key: 'emotionTriggers', ellipsis: true },
                        { title: '感想', dataIndex: 'diaryContent', key: 'diaryContent', ellipsis: true },
                    ]}
                />
                </div>
            </div>
        </div>
    )
}