import { useCallback, useEffect, useState } from 'react'
import { Button, Form, Select, Space, Table, Tag, message } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { getAgentLogs } from '../apis/admin'
import type { AgentLogType } from '../types/adminType'

const INTENT_OPTIONS = [
    { label: '全部', value: '' },
    { label: '倾听', value: 'listen' },
    { label: '咨询', value: 'counsel' },
    { label: '危机', value: 'crisis' },
    { label: '知识', value: 'knowledge' },
]

const INTENT_COLORS: Record<string, string> = {
    listen: 'blue',
    counsel: 'green',
    crisis: 'red',
    knowledge: 'purple',
}

export default function AgentLogs() {
    const [form] = Form.useForm()
    const [logs, setLogs] = useState<AgentLogType[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const fetchLogs = useCallback(async (page = currentPage, size = pageSize) => {
        try {
            setLoading(true)
            const values = form.getFieldsValue()
            const res = await getAgentLogs({
                pageNum: page.toString(),
                pageSize: size.toString(),
                intent: values.intent || '',
            })
            setLogs(res.data.records || [])
            setTotal(res.data.total || 0)
        } catch (error) {
            message.error((error as Error).message || '加载执行日志失败')
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, form])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: '用户',
            dataIndex: 'userNickname',
            key: 'userNickname',
            width: 100,
        },
        {
            title: '会话ID',
            dataIndex: 'sessionId',
            key: 'sessionId',
            width: 80,
        },
        {
            title: '用户消息',
            dataIndex: 'userMessage',
            key: 'userMessage',
            ellipsis: true,
        },
        {
            title: '意图',
            dataIndex: 'intent',
            key: 'intent',
            width: 80,
            render: (intent: string) => (
                <Tag color={INTENT_COLORS[intent] || 'default'}>{intent}</Tag>
            ),
        },
        {
            title: 'Agent',
            dataIndex: 'activeAgent',
            key: 'activeAgent',
            width: 120,
        },
        {
            title: '延迟(ms)',
            dataIndex: 'latencyMs',
            key: 'latencyMs',
            width: 90,
            align: 'center' as const,
        },
        {
            title: 'LLM',
            dataIndex: 'llmUsed',
            key: 'llmUsed',
            width: 60,
            align: 'center' as const,
            render: (used: boolean) => used ? <Tag color="green">是</Tag> : <Tag>否</Tag>,
        },
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (val: string) => val ? val.replace('T', ' ').slice(0, 19) : '-',
        },
    ]

    const handleTableChange = (pagination: TablePaginationConfig) => {
        const { current, pageSize: size } = pagination
        if (current) setCurrentPage(current)
        if (size) setPageSize(size)
        fetchLogs(current || 1, size || pageSize)
    }

    return (
        <>
            <div className="text-2xl">Agent 执行日志</div>
            <Form form={form} onFinish={() => { setCurrentPage(1); fetchLogs(1, pageSize) }} className="mt-4">
                <Space wrap>
                    <Form.Item label="意图" name="intent" className="mb-0">
                        <Select options={INTENT_OPTIONS} style={{ width: 120 }} allowClear placeholder="全部" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">查询</Button>
                    </Form.Item>
                </Space>
            </Form>
            <Table
                className="mt-4"
                dataSource={logs}
                columns={columns}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1000 }}
                pagination={{
                    current: currentPage,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 条`,
                }}
                onChange={handleTableChange}
                locale={{ emptyText: '暂无执行日志' }}
            />
        </>
    )
}
