import { useCallback, useEffect, useState } from 'react'
import {
    Badge, Button, Descriptions, Form, Input, Modal, Select, Space, Table, Tag, message
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { getRiskAlerts, updateRiskAlert } from '../apis/admin'
import type { RiskAlertType } from '../types/adminType'

const RISK_COLORS: Record<number, string> = {
    2: 'orange',
    3: 'red',
}

const STATUS_OPTIONS = [
    { label: '待处理', value: 'pending' },
    { label: '处理中', value: 'processing' },
    { label: '已处理', value: 'resolved' },
]

export default function RiskAlertCenter() {
    const [form] = Form.useForm()
    const [alerts, setAlerts] = useState<RiskAlertType[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [currentAlert, setCurrentAlert] = useState<RiskAlertType>()
    const [visible, setVisible] = useState(false)
    const [noteForm] = Form.useForm()

    const fetchAlerts = useCallback(async (page = currentPage, size = pageSize) => {
        try {
            setLoading(true)
            const values = form.getFieldsValue()
            const res = await getRiskAlerts({
                pageNum: page.toString(),
                pageSize: size.toString(),
                status: values.status || '',
                riskLevel: values.riskLevel || '',
            })
            setAlerts(res.data.records || [])
            setTotal(res.data.total || 0)
        } catch (error) {
            message.error((error as Error).message || '加载预警列表失败')
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, form])

    useEffect(() => {
        fetchAlerts()
    }, [fetchAlerts])

    const handleProcess = (record: RiskAlertType) => {
        setCurrentAlert(record)
        noteForm.setFieldsValue({
            status: record.status === 'pending' ? 'processing' : record.status,
            adminNote: record.adminNote,
        })
        setVisible(true)
    }

    const handleSubmit = async () => {
        if (!currentAlert) return
        try {
            const values = await noteForm.validateFields()
            await updateRiskAlert(currentAlert.id, values)
            message.success('更新成功')
            setVisible(false)
            fetchAlerts()
        } catch (error) {
            if ((error as { errorFields?: unknown }).errorFields) return
            message.error((error as Error).message || '更新失败')
        }
    }

    const columns = [
        {
            title: '用户',
            dataIndex: 'userNickname',
            key: 'userNickname',
            width: 100,
        },
        {
            title: '风险等级',
            dataIndex: 'riskLevel',
            key: 'riskLevel',
            width: 100,
            render: (level: number) => (
                <Tag color={RISK_COLORS[level] || 'default'}>
                    {level === 3 ? '高风险' : level === 2 ? '中风险' : `等级${level}`}
                </Tag>
            ),
        },
        {
            title: '触发原因',
            dataIndex: 'triggerReason',
            key: 'triggerReason',
            width: 140,
        },
        {
            title: '用户消息',
            dataIndex: 'userMessage',
            key: 'userMessage',
            ellipsis: true,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (_: unknown, record: RiskAlertType) => (
                <Badge
                    status={record.status === 'pending' ? 'error' : record.status === 'processing' ? 'processing' : 'success'}
                    text={record.statusText}
                />
            ),
        },
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (val: string) => val ? new Date(val).toLocaleString() : '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: unknown, record: RiskAlertType) => (
                <Button type="link" size="small" onClick={() => handleProcess(record)}>
                    处理
                </Button>
            ),
        },
    ]

    const handleTableChange = (pagination: TablePaginationConfig) => {
        const page = pagination.current || 1
        const size = pagination.pageSize || 10
        setCurrentPage(page)
        setPageSize(size)
        fetchAlerts(page, size)
    }

    return (
        <div>
            <Form form={form} layout="inline" className="mb-4">
                <Form.Item name="status" label="状态">
                    <Select allowClear placeholder="全部" style={{ width: 120 }} options={STATUS_OPTIONS} />
                </Form.Item>
                <Form.Item name="riskLevel" label="风险等级">
                    <Select
                        allowClear
                        placeholder="全部"
                        style={{ width: 120 }}
                        options={[
                            { label: '中风险', value: '2' },
                            { label: '高风险', value: '3' },
                        ]}
                    />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" onClick={() => fetchAlerts(1, pageSize)}>查询</Button>
                        <Button onClick={() => { form.resetFields(); fetchAlerts(1, pageSize) }}>重置</Button>
                    </Space>
                </Form.Item>
            </Form>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={alerts}
                loading={loading}
                scroll={{ x: 900 }}
                pagination={{ current: currentPage, pageSize, total, showSizeChanger: true }}
                onChange={handleTableChange}
            />

            <Modal
                title="处理风险预警"
                open={visible}
                onCancel={() => setVisible(false)}
                onOk={handleSubmit}
                width={640}
            >
                {currentAlert && (
                    <>
                        <Descriptions column={1} size="small" className="mb-4">
                            <Descriptions.Item label="用户">{currentAlert.userNickname}</Descriptions.Item>
                            <Descriptions.Item label="触发原因">{currentAlert.triggerReason}</Descriptions.Item>
                            <Descriptions.Item label="用户消息">{currentAlert.userMessage}</Descriptions.Item>
                        </Descriptions>
                        <Form form={noteForm} layout="vertical">
                            <Form.Item name="status" label="处理状态" rules={[{ required: true }]}>
                                <Select options={STATUS_OPTIONS} />
                            </Form.Item>
                            <Form.Item name="adminNote" label="处理备注">
                                <Input.TextArea rows={4} placeholder="记录处理措施与跟进情况" />
                            </Form.Item>
                        </Form>
                    </>
                )}
            </Modal>
        </div>
    )
}
