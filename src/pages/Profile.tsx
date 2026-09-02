import { Avatar, Card, Descriptions, List, message, Statistic } from 'antd'
import { MessageOutlined, BookOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSessionsByPage } from '../apis/sessions'
import Loading from '../components/common/Loading'
import { useUserStore } from '../store/userStore'
import type { sessionItemType } from '../types/sessionsType'
import { fileBaseUrl } from '../config'

export default function Profile() {
    const navigate = useNavigate()
    const userInfo = useUserStore(state => state.userInfo)
    const [sessions, setSessions] = useState<sessionItemType[]>([])
    const [totalSessions, setTotalSessions] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const res = await getSessionsByPage({ pageNum: '1', pageSize: '5' })
                setSessions(res.data?.records ?? [])
                setTotalSessions(res.data?.total ?? 0)
            } catch (error) {
                message.error((error as Error).message || '加载数据失败')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <Loading tip="加载个人中心..." />

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Card className="mb-6">
                <div className="flex items-center gap-6">
                    <Avatar
                        size={80}
                        icon={!userInfo?.avatar ? <UserOutlined /> : undefined}
                        src={userInfo?.avatar ? `${fileBaseUrl}${userInfo.avatar}` : undefined}
                    />
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{userInfo?.nickname || userInfo?.username}</h2>
                        <p className="text-gray-500">{userInfo?.email}</p>
                        <p className="text-gray-400 text-sm mt-1">
                            注册时间：{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : '—'}
                        </p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <Statistic title="咨询会话" value={totalSessions} prefix={<MessageOutlined />} />
                </Card>
                <Card>
                    <Statistic
                        title="快捷入口"
                        value="AI咨询"
                        prefix={<MessageOutlined className="text-[#589081]" />}
                        suffix={<Link to="/consultation" className="text-sm text-[#589081]">前往 →</Link>}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="情绪日记"
                        value="记录"
                        prefix={<BookOutlined className="text-[#589081]" />}
                        suffix={<Link to="/diary" className="text-sm text-[#589081]">前往 →</Link>}
                    />
                </Card>
            </div>

            <Card title="最近咨询会话">
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

            <Card title="账号信息" className="mt-6">
                <Descriptions column={2}>
                    <Descriptions.Item label="用户名">{userInfo?.username}</Descriptions.Item>
                    <Descriptions.Item label="昵称">{userInfo?.nickname}</Descriptions.Item>
                    <Descriptions.Item label="邮箱">{userInfo?.email}</Descriptions.Item>
                    <Descriptions.Item label="手机">{userInfo?.phone || '未填写'}</Descriptions.Item>
                    <Descriptions.Item label="性别">{userInfo?.genderDisplayName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="账号状态">{userInfo?.statusDisplayName || '—'}</Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    )
}
