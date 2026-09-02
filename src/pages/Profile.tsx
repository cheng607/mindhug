import { Avatar, Button, Card, Descriptions, Form, Input, List, message, Modal, Select, Statistic, Tag } from 'antd'
import { BookOutlined, EditOutlined, LockOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyDiaries } from '../apis/emotion'
import { getSessionsByPage } from '../apis/sessions'
import { changePassword, updateProfile } from '../apis/user'
import Loading from '../components/common/Loading'
import { useUserStore } from '../store/userStore'
import type { diaryType } from '../types/emotionType'
import type { sessionItemType } from '../types/sessionsType'
import { fileBaseUrl } from '../config'

export default function Profile() {
    const navigate = useNavigate()
    const userInfo = useUserStore(state => state.userInfo)
    const roleType = useUserStore(state => state.roleType)
    const setUserInfo = useUserStore(state => state.setUserInfo)
    const [sessions, setSessions] = useState<sessionItemType[]>([])
    const [diaries, setDiaries] = useState<diaryType[]>([])
    const [totalSessions, setTotalSessions] = useState(0)
    const [totalDiaries, setTotalDiaries] = useState(0)
    const [loading, setLoading] = useState(true)
    const [profileOpen, setProfileOpen] = useState(false)
    const [passwordOpen, setPasswordOpen] = useState(false)
    const [profileForm] = Form.useForm()
    const [passwordForm] = Form.useForm()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [sessionRes, diaryRes] = await Promise.all([
                    getSessionsByPage({ pageNum: '1', pageSize: '5' }),
                    getMyDiaries({ currentPage: '1', size: '5' }),
                ])
                setSessions(sessionRes.data?.records ?? [])
                setTotalSessions(sessionRes.data?.total ?? 0)
                setDiaries(diaryRes.data?.records ?? [])
                setTotalDiaries(diaryRes.data?.total ?? 0)
            } catch (error) {
                message.error((error as Error).message || '加载数据失败')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const openProfileModal = () => {
        profileForm.setFieldsValue({
            nickname: userInfo?.nickname,
            phone: userInfo?.phone,
            gender: userInfo?.gender,
        })
        setProfileOpen(true)
    }

    const handleProfileSubmit = async () => {
        try {
            const values = await profileForm.validateFields()
            const res = await updateProfile(values)
            if (res.data && roleType) {
                setUserInfo(res.data, roleType)
            }
            message.success('资料更新成功')
            setProfileOpen(false)
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return
            message.error((error as Error).message || '更新失败')
        }
    }

    const handlePasswordSubmit = async () => {
        try {
            const values = await passwordForm.validateFields()
            await changePassword(values)
            message.success('密码修改成功，请重新登录')
            setPasswordOpen(false)
            passwordForm.resetFields()
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return
            message.error((error as Error).message || '修改失败')
        }
    }

    if (loading) return <Loading tip="加载个人中心..." />

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Card className="mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <Avatar
                        size={80}
                        icon={!userInfo?.avatar ? <UserOutlined /> : undefined}
                        src={userInfo?.avatar ? `${fileBaseUrl}${userInfo.avatar}` : undefined}
                    />
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl font-bold mb-1">{userInfo?.nickname || userInfo?.username}</h2>
                        <p className="text-gray-500">{userInfo?.email}</p>
                        <p className="text-gray-400 text-sm mt-1">
                            注册时间：{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '—'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                            <Button icon={<EditOutlined />} onClick={openProfileModal}>编辑资料</Button>
                            <Button icon={<LockOutlined />} onClick={() => setPasswordOpen(true)}>修改密码</Button>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card>
                    <Statistic title="咨询会话" value={totalSessions} prefix={<MessageOutlined />} />
                </Card>
                <Card>
                    <Statistic title="情绪日记" value={totalDiaries} prefix={<BookOutlined />} />
                </Card>
                <Card>
                    <Statistic
                        title="快捷入口"
                        value="AI咨询"
                        prefix={<MessageOutlined className="text-[#589081]" />}
                        suffix={<Link to="/consultation" className="text-sm text-[#589081]">前往 →</Link>}
                    />
                </Card>
            </div>

            <Card title="最近咨询会话" className="mb-6">
                {sessions.length > 0 ? (
                    <List
                        dataSource={sessions}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={item.sessionTitle}
                                    description={
                                        <>
                                            <span className="text-gray-500 text-sm">{item.lastMessageTime}</span>
                                            <span className="mx-2">·</span>
                                            <span className="text-gray-400 text-sm">{item.messageCount} 条消息</span>
                                            {item.emotionTag && (
                                                <Tag color="green" className="ml-2">{item.emotionTag}</Tag>
                                            )}
                                        </>
                                    }
                                />
                                <a
                                    className="text-[#589081] cursor-pointer"
                                    onClick={() => navigate('/consultation', {
                                        state: { sessionId: item.id, sessionTitle: item.sessionTitle }
                                    })}
                                >
                                    继续对话
                                </a>
                            </List.Item>
                        )}
                    />
                ) : (
                    <p className="text-gray-400 text-center py-4">
                        暂无咨询记录，<Link to="/consultation">开始第一次对话</Link>
                    </p>
                )}
            </Card>

            <Card title="最近情绪日记">
                {diaries.length > 0 ? (
                    <List
                        dataSource={diaries}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={
                                        <span>
                                            {item.diaryDate}
                                            <Tag color="blue" className="ml-2">{item.dominantEmotion}</Tag>
                                            <span className="text-gray-400 text-sm ml-2">心情 {item.moodScore}/10</span>
                                        </span>
                                    }
                                    description={item.diaryContentPreview || item.diaryContent?.slice(0, 80)}
                                />
                                <Link to="/diary" className="text-[#589081]">查看</Link>
                            </List.Item>
                        )}
                    />
                ) : (
                    <p className="text-gray-400 text-center py-4">
                        暂无日记，<Link to="/diary">写第一篇日记</Link>
                    </p>
                )}
            </Card>

            <Card title="账号信息" className="mt-6">
                <Descriptions column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="用户名">{userInfo?.username}</Descriptions.Item>
                    <Descriptions.Item label="昵称">{userInfo?.nickname}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{userInfo?.email}</Descriptions.Item>
                    <Descriptions.Item label="手机">{userInfo?.phone || '未填写'}</Descriptions.Item>
                    <Descriptions.Item label="性别">{userInfo?.genderDisplayName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="账号状态">{userInfo?.statusDisplayName || '—'}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Modal
                title="编辑资料"
                open={profileOpen}
                onOk={handleProfileSubmit}
                onCancel={() => setProfileOpen(false)}
                destroyOnClose
            >
                <Form form={profileForm} layout="vertical">
                    <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                        <Input maxLength={50} />
                    </Form.Item>
                    <Form.Item name="phone" label="手机">
                        <Input maxLength={20} placeholder="选填" />
                    </Form.Item>
                    <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                        <Select options={[{ value: 1, label: '男' }, { value: 2, label: '女' }]} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="修改密码"
                open={passwordOpen}
                onOk={handlePasswordSubmit}
                onCancel={() => { setPasswordOpen(false); passwordForm.resetFields() }}
                destroyOnClose
            >
                <Form form={passwordForm} layout="vertical">
                    <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6, message: '至少 6 位' }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="确认新密码"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error('两次密码不一致'))
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
