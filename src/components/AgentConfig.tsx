import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Form, Input, InputNumber, message, Select, Space, Tabs } from 'antd'
import {
    getAgentConfigs,
    reindexKnowledge,
    updateAgentConfig,
} from '../apis/admin'

import type { AgentPromptConfigType } from '../types/adminType'

export default function AgentConfig() {
    const [configs, setConfigs] = useState<AgentPromptConfigType[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [reindexing, setReindexing] = useState(false)
    const [activeKey, setActiveKey] = useState('')
    const [form] = Form.useForm()

    const fetchConfigs = useCallback(async () => {
        try {
            setLoading(true)
            const res = await getAgentConfigs()
            const list = res.data || []
            setConfigs(list)
            if (list.length > 0 && !activeKey) {
                setActiveKey(list[0].agentKey)
            }
        } catch (error) {
            message.error((error as Error).message || '加载 Agent 配置失败')
        } finally {
            setLoading(false)
        }
    }, [activeKey])

    useEffect(() => {
        fetchConfigs()
    }, [fetchConfigs])

    useEffect(() => {
        const current = configs.find(item => item.agentKey === activeKey)
        if (current) {
            form.setFieldsValue({
                systemPrompt: current.systemPrompt,
                model: current.model,
                temperature: current.temperature,
                maxTokens: current.maxTokens,
                isActive: current.isActive,
            })
        }
    }, [activeKey, configs, form])

    const handleSave = async () => {
        if (!activeKey) return
        try {
            setSaving(true)
            const values = await form.validateFields()
            await updateAgentConfig(activeKey, values)
            message.success('保存成功')
            fetchConfigs()
        } catch (error) {
            if ((error as { errorFields?: unknown }).errorFields) return
            message.error((error as Error).message || '保存失败')
        } finally {
            setSaving(false)
        }
    }

    const handleReindex = async () => {
        try {
            setReindexing(true)
            const res = await reindexKnowledge()
            message.success(`知识库索引完成，共 ${res.data.chunkCount} 个分块`)
        } catch (error) {
            message.error((error as Error).message || '索引失败')
        } finally {
            setReindexing(false)
        }
    }

    const tabItems = configs.map(item => ({
        key: item.agentKey,
        label: item.agentName,
    }))

    return (
        <div>
            <Card className="mb-4" size="small">
                <Space>
                    <span className="text-gray-600">知识库 RAG 向量索引</span>
                    <Button loading={reindexing} onClick={handleReindex}>
                        重新索引已发布文章
                    </Button>
                </Space>
            </Card>

            <Tabs
                activeKey={activeKey}
                items={tabItems}
                onChange={setActiveKey}
            />

            <Card loading={loading}>
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="systemPrompt"
                        label="System Prompt"
                        rules={[{ required: true, message: '请输入 Prompt' }]}
                    >
                        <Input.TextArea rows={12} placeholder="Agent 系统提示词" />
                    </Form.Item>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item name="model" label="模型">
                            <Input placeholder="如 deepseek-chat" />
                        </Form.Item>
                        <Form.Item name="temperature" label="Temperature">
                            <InputNumber min={0} max={2} step={0.1} className="w-full" />
                        </Form.Item>
                        <Form.Item name="maxTokens" label="Max Tokens">
                            <InputNumber min={256} max={4096} step={128} className="w-full" />
                        </Form.Item>
                    </div>
                    <Form.Item name="isActive" label="状态">
                        <Select
                            options={[
                                { label: '启用', value: 1 },
                                { label: '禁用', value: 0 },
                            ]}
                        />
                    </Form.Item>
                    <Button type="primary" loading={saving} onClick={handleSave}>
                        保存配置
                    </Button>
                </Form>
            </Card>
        </div>
    )
}
