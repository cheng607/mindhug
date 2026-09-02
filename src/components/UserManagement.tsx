import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../apis/admin'
import type { UserInfoType } from '../types/userType'

export default function UserManagement() {
    const [form] = Form.useForm()
    const [users, setUsers] = useState<UserInfoType[]>([])
    const [loading, setLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const fetchUsers = useCallback(async (page = currentPage, size = pageSize) => {
        try {
            setLoading(true)
            const values = form.getFieldsValue()
            const res = await getAdminUsers({
                pageNum: String(page),
                pageSize: String(size),
                username: values.username || '',
                status: values.status !== undefined && values.status !== '' ? String(values.status) : '',
            })
            setUsers(res.data?.records ?? [])
            setTotal(res.data?.total ?? 0)
        } catch (error) {
            message.error((error as Error).message || '加载用户失败')
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, form])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleStatusChange = (user: UserInfoType, status: number) => {
        const action = status === 0 ? '封禁' : '解封'
        Modal.confirm({
            title: `确认${action}用户 ${user.username}？`,
            onOk: async () => {
                await updateAdminUserStatus(user.id, status)
                message.success(`${action}成功`)
                fetchUsers()
            },
        })
    }

    const handleRoleChange = (user: UserInfoType, roleCode: number) => {
        const label = roleCode === 2 ? '管理员' : '普通用户'
        Modal.confirm({
            title: `将 ${user.username} 设为${label}？`,
            onOk: async () => {
                await updateAdminUserRole(user.id, roleCode)
                message.success('角色更新成功')
                fetchUsers()
            },
        })
    }

    const columns = [
        { title: 'ID', dataIndex: 'id', width: 70 },
        { title: '用户名', dataIndex: 'username', width: 120 },
        { title: '昵称', dataIndex: 'nickname', width: 120 },
        { title: '邮箱', dataIndex: 'email', ellipsis: true },
        {
            title: '角色',
            dataIndex: 'userTypeDisplayName',
            width: 100,
            render: (_: unknown, record: UserInfoType) => (
                <Tag color={record.userType === 2 ? 'gold' : 'blue'}>{record.userTypeDisplayName}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'statusDisplayName',
            width: 90,
            render: (_: unknown, record: UserInfoType) => (
                <Tag color={record.status === 1 ? 'green' : 'red'}>{record.statusDisplayName}</Tag>
            ),
        },
        {
            title: '注册时间',
            dataIndex: 'createdAt',
            width: 120,
            render: (value: string) => value ? new Date(value).toLocaleDateString() : '—',
        },
        {
            title: '操作',
            key: 'actions',
            width: 220,
            render: (_: unknown, record: UserInfoType) => (
                <Space size="small" wrap>
                    {record.status === 1 ? (
                        <Button size="small" danger onClick={() => handleStatusChange(record, 0)}>封禁</Button>
                    ) : (
                        <Button size="small" type="primary" onClick={() => handleStatusChange(record, 1)}>解封</Button>
                    )}
                    {record.userType === 2 ? (
                        <Button size="small" onClick={() => handleRoleChange(record, 1)}>设为用户</Button>
                    ) : (
                        <Button size="small" onClick={() => handleRoleChange(record, 2)}>设为管理员</Button>
                    )}
                </Space>
            ),
        },
    ]

    const onTableChange = (pagination: TablePaginationConfig) => {
        const page = pagination.current ?? 1
        const size = pagination.pageSize ?? 10
        setCurrentPage(page)
        setPageSize(size)
        fetchUsers(page, size)
    }

    return (
        <div>
            <Form form={form} layout="inline" className="mb-4" onFinish={() => fetchUsers(1, pageSize)}>
                <Form.Item name="username" label="搜索">
                    <Input placeholder="用户名/邮箱/昵称" allowClear />
                </Form.Item>
                <Form.Item name="status" label="状态">
                    <Select allowClear placeholder="全部" style={{ width: 120 }} options={[
                        { value: 1, label: '正常' },
                        { value: 0, label: '禁用' },
                    ]} />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">查询</Button>
                </Form.Item>
            </Form>
            <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={users}
                pagination={{ current: currentPage, pageSize, total, showSizeChanger: true }}
                onChange={onTableChange}
                scroll={{ x: 900 }}
            />
        </div>
    )
}
