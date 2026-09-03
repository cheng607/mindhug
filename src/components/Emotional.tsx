import { Button, Descriptions, Form, Input, Modal, Progress, Rate, Row, Select, Table, message } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { useEffect, useState, useCallback } from "react";
import { deleteDiary, getDiary } from "../apis/emotion";
import { exportAdminDiariesCsv } from "../apis/admin";
import type { aiDataType, diaryParamType, diaryType } from "../types/emotionType";
import { parseAiEmotionAnalysis } from "../utils/emotion";

const RISK_LABELS: Record<number, string> = {
    0: '正常',
    1: '需关注',
    2: '中度风险',
    3: '高风险',
};

export default function Emotional() {
    const [form] = Form.useForm()
    const [dairies, setDairiess] = useState<diaryType[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [currentDiary, setCurrentDiary] = useState<diaryType>();
    const [visible, setVisible] = useState(false);
    const [aiData, setAiData] = useState<aiDataType>(parseAiEmotionAnalysis(''));

    // 查询情绪日志
    const searchDiary = useCallback(async (params?: diaryParamType) => {
        try {
            setLoading(true);
            const queryParams: diaryParamType = {
                currentPage: (params?.currentPage || currentPage).toString(),
                size: (params?.size || pageSize).toString(),
                userId: params?.userId || form.getFieldValue('userId'),
                ...params
            };

            // 处理情绪评分范围
            const scoreRange = form.getFieldValue('scoreRange');
            if (scoreRange) {
                if (scoreRange === '1-3') {
                    queryParams.minMoodScore = '1';
                    queryParams.maxMoodScore = '3';
                } else if (scoreRange === '4-6') {
                    queryParams.minMoodScore = '4';
                    queryParams.maxMoodScore = '6';
                } else if (scoreRange === '7-10') {
                    queryParams.minMoodScore = '7';
                    queryParams.maxMoodScore = '10';
                }
            }

            const res = await getDiary(queryParams);
            setDairiess(res.data.records || []);
            setTotal(res.data.total || 0);
        } catch (error) {
            console.error('查询失败', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, form]);

    // 表格列配置
    const columns = [
        {
            title: '日记ID',
            dataIndex: 'id',
            key: 'id',
            width: 80
        },
        {
            title: '用户',
            key: 'username',
            width: 100,
            render: (_: unknown, record: diaryType) => {
                return (
                    <div className="rounded-full bg-gray-300 w-14 h-14 flex items-center justify-center text-white">
                        {record.username?.charAt(0) || '?'}
                    </div>
                );
            }
        },
        {
            title: '记录日期',
            dataIndex: 'diaryDate',
            key: 'diaryDate',
            width: 120
        },
        {
            title: '情绪评分',
            dataIndex: 'moodScore',
            key: 'moodScore',
            width: 320,
            render: (_: unknown, record: diaryType) => {
                return (
                    <Rate disabled defaultValue={record.moodScore} count={10} />
                );
            }
        },
        {
            title: '睡眠/压力',
            dataIndex: 'dominantEmotion',
            key: 'dominantEmotion',
            render: (_: unknown, record: diaryType) => {
                return (
                    <>
                        <div>睡眠：{record.sleepQuality}/5</div>
                        <div>压力：{record.stressLevel}/5</div>
                    </>
                );
            }
        },
        {
            title: '情绪触发因素',
            dataIndex: 'emotionTriggers',
            key: 'emotionTriggers',
        },
        {
            title: '日记内容',
            dataIndex: 'diaryContent',
            key: 'diaryContent',
            width: 200
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: diaryType) => (
                <>
                    <Button type="link" onClick={() => {
                        setCurrentDiary(record);
                        setVisible(true);
                        setAiData(parseAiEmotionAnalysis(record.aiEmotionAnalysis));
                    }}>详情</Button>
                    <Button type="link" danger onClick={() => { handleDelete(record.id.toString()) }}>删除</Button>
                </>
            ),
        }

    ];

    // 表格分页变化
    const handleTableChange = (pagination: TablePaginationConfig) => {
        const { current, pageSize: size } = pagination;
        if (current) setCurrentPage(current);
        if (size) setPageSize(size);
        searchDiary({ currentPage: current?.toString(), size: size?.toString() });
    };

    // 重置并重新查询
    const handleReset = () => {
        form.resetFields();
        setCurrentPage(1);
        searchDiary({ currentPage: '1', size: pageSize.toString() });
    };

    // 组件加载时查询数据
    useEffect(() => {
        searchDiary();
    }, [searchDiary]);

    // 删除日志
    const handleDelete = async (id: string) => {
        try {
            await deleteDiary(id);
            message.success('删除成功');
            searchDiary({ currentPage: currentPage.toString(), size: pageSize.toString() });
        } catch (error) {
            console.error('删除失败', error);
            message.error('删除失败，请重试');
        }
    }
    const handleExport = async () => {
        try {
            const scoreRange = form.getFieldValue('scoreRange')
            let minMoodScore: string | undefined
            let maxMoodScore: string | undefined
            if (scoreRange === '1-3') {
                minMoodScore = '1'
                maxMoodScore = '3'
            } else if (scoreRange === '4-6') {
                minMoodScore = '4'
                maxMoodScore = '6'
            } else if (scoreRange === '7-10') {
                minMoodScore = '7'
                maxMoodScore = '10'
            }
            await exportAdminDiariesCsv({
                userId: form.getFieldValue('userId') || undefined,
                minMoodScore,
                maxMoodScore,
            })
            message.success('情绪日志已导出')
        } catch (error) {
            message.error((error as Error).message || '导出失败')
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">情绪日志</div>
                <Button onClick={handleExport}>导出 CSV</Button>
            </div>
            <Form form={form} onFinish={searchDiary}>
                <Row className="flex gap-5 mt-5">
                    <Form.Item label="用户ID" name="userId" className="w-72">
                        <Input placeholder="请输入用户ID" />
                    </Form.Item>
                    <Form.Item label="情绪评分" name="scoreRange" className="w-72">
                        <Select placeholder="选择评分范围" options={[
                            { label: '全部', value: '' },
                            { label: '低分（1-3）', value: '1-3' },
                            { label: '中分（4-6）', value: '4-6' },
                            { label: '高分（7-10）', value: '7-10' },
                        ]}
                        />
                    </Form.Item>
                </Row>
                <div className="flex items-center gap-3">
                    <Button type="primary" htmlType="submit" >查询</Button>
                    <Button onClick={handleReset}>重置</Button>
                </div>
            </Form>

            <div className="mt-5">
                <Table
                    dataSource={dairies}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条数据`,
                        total: total,
                    }}
                    onChange={handleTableChange}
                    locale={{ emptyText: "暂无情绪日志数据" }}
                />
            </div>
            <Modal
                title="情绪日记详情"
                open={visible}
                cancelText="关闭"
                onCancel={() => setVisible(false)}
                width={700}
                footer={[
                    <Button key="close" onClick={() => setVisible(false)} type="primary">
                        关闭
                    </Button>
                ]}
            >
                <Descriptions title="用户信息" bordered column={2} >
                    <Descriptions.Item label="用户名">{currentDiary?.username}</Descriptions.Item>
                    <Descriptions.Item label="昵称">{currentDiary?.nickname}</Descriptions.Item>
                    <Descriptions.Item label="用户ID">{currentDiary?.userId}</Descriptions.Item>
                    <Descriptions.Item label="记录日期">{currentDiary?.diaryDate}</Descriptions.Item>
                </Descriptions>
                <Descriptions title="情绪状态" bordered column={2} >
                    <Descriptions.Item label="情绪评分">
                        <Rate disabled defaultValue={currentDiary?.moodScore} count={10} />
                    </Descriptions.Item>
                    <Descriptions.Item label="主要情绪">
                        <span className="bg-gray-100 text-gray-400 p-1 text-xs rounded">{currentDiary?.dominantEmotion}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="睡眠质量">{currentDiary?.sleepQuality || '-'}/5</Descriptions.Item>
                    <Descriptions.Item label="压力水平">{currentDiary?.stressLevel || '-'}/5</Descriptions.Item>
                </Descriptions>
                <Descriptions title="日记内容" bordered column={1} >
                    <Descriptions.Item label="情绪触发因素">{currentDiary?.emotionTriggers}</Descriptions.Item>
                    <Descriptions.Item label="日记内容">{currentDiary?.diaryContent}</Descriptions.Item>
                </Descriptions>
                <Descriptions title="AI情绪分析结果" bordered column={2} >
                    <Descriptions.Item label="主要情绪">{aiData?.primaryEmotion}</Descriptions.Item>
                    <Descriptions.Item label="情绪强度">
                        <Progress percent={Math.round((aiData?.emotionScore ?? 0) * 100)} />
                    </Descriptions.Item>
                    <Descriptions.Item label="风险等级">
                        {RISK_LABELS[aiData?.riskLevel ?? 0] ?? '未知'}
                    </Descriptions.Item>
                    <Descriptions.Item label="情绪性质">{aiData?.isNegative ? '负面情绪' : '正面情绪'}</Descriptions.Item>
                </Descriptions>
                <div className="bg-[#F7FAF9] p-3 rounded-lg my-4">
                    <div className="p-1 text-sm font-medium">专业建议</div>
                    <div className="bg-white p-3">{aiData?.suggestion || '无'}</div>
                </div>
                <div className="bg-[#F7FAF9] p-3 rounded-lg mb-4">
                    <div className="p-1 text-sm font-medium">风险描述</div>
                    <div className="bg-white p-3">{aiData?.riskDescription || '无'}</div>
                </div>
                <div className="bg-[#F7FAF9] p-3 rounded-lg mb-4">
                    <div className="p-1 text-sm font-medium">改善建议</div>
                    <ul className="bg-white p-3">
                        {aiData?.improvementSuggestions && aiData.improvementSuggestions.length > 0 ? (
                            aiData.improvementSuggestions.map((suggestion, index) => (
                                <li key={index} className="mb-2">{suggestion}</li>
                            ))
                        ) : (
                            <li className="mb-2">无</li>
                        )}
                    </ul>
                </div>
                <p className="text-xs text-gray-500 my-3">分析时间：{aiData?.timestamp}</p>
                <Descriptions title="时间信息" bordered column={2} >
                    <Descriptions.Item label="创建时间">{currentDiary?.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="更新时间">{currentDiary?.updatedAt}</Descriptions.Item>
                </Descriptions>
            </Modal>
        </>
    )
}
