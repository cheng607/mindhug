import { useEffect, useState } from "react";
import { getSessionDetail, getSessions } from "../apis/sessions";
import type { sessionDetailType, sessionType } from "../types/sessionsType";
import { Button, Modal, Space, Table, message } from "antd";
import type { TablePaginationConfig } from "antd/es/table";

export default function Consultations() {
    const [sessionList, setSessionList] = useState<sessionType[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentDetail, setCurrentDetail] = useState<sessionDetailType[]>([]);
    const [currentSession, setCurrentSession] = useState<sessionType>();
    const [visible, setVisible] = useState<boolean>(false);
    const columns = [
        {
            title: '会话ID',
            dataIndex: 'userNickname',
            key: 'userNickname',
            width: 80,
            render: (_: unknown, record: sessionType) => {
                return (
                    <div className="rounded-full bg-gray-300 w-14 h-14 flex items-center justify-center">
                        {record.userNickname}
                    </div>
                );
            }
        },
        {
            title: '情绪标签',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 400,
            render: (_: unknown, record: sessionType) => {
                return (
                    <div className="text-gray-600">
                        <p>{record.sessionTitle}</p>
                        <p>{record.lastMessageContent}</p>
                    </div>
                );
            }
        },
        {
            title: '消息数',
            dataIndex: 'messageCount',
            key: 'messageCount',
            width: 50,
            align: 'center' as const,
        },
        {
            title: '时间',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 50,
            align: 'center' as const,
        },
        {
            title: '操作',
            key: 'action',
            width: 50,
            align: 'center' as const,
            // 操作按钮组
            render: (_: unknown, record: sessionType) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        onClick={() => { handleDetail(record.id.toString(), record) }}
                    >
                        详情
                    </Button>
                </Space>
            ),
        },
    ];
    const fetchSessions = async (page: number, size: number) => {
        try {
            setLoading(true);
            const params = {
                currentPage: page.toString(),
                size: size.toString(),
                emotionTag: ''
            }
            const res = await getSessions(params)
            setTotal(res.data.total)
            setSessionList(res.data.records)
        } catch (error) {
            console.error('获取失败', error)
            message.error((error as Error).message || '获取咨询记录失败')
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSessions(currentPage, pageSize)
    }, [currentPage, pageSize])

    const handleTableChange = (pagination: TablePaginationConfig) => {
        const { current, pageSize: size } = pagination;
        if (current) setCurrentPage(current);
        if (size) setPageSize(size);
    }
    // 获取文章详情
    const handleDetail = async (sessionId: string, session: sessionType) => {
        try {
            const res = await getSessionDetail(sessionId);
            setCurrentDetail(res.data)
            setCurrentSession(session)
            setVisible(true);
        } catch (error) {
            console.error(error)
            message.error((error as Error).message || '获取会话详情失败')
        }
    }
    return (
        <>
            <div className="text-2xl">咨询记录</div>
            <Table
                dataSource={sessionList}
                columns={columns}
                rowKey="id"
                bordered
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条数据`,
                    total: total,
                }}
                onChange={handleTableChange}
                locale={{ emptyText: "暂无咨询记录" }}
            />
            <Modal
                title="咨询会话详情"
                open={visible}
                cancelText="关闭"
                onCancel={() => setVisible(false)}
                width={800}
                footer={[
                    <Button key="close" onClick={() => setVisible(false)} type="primary">
                        关闭
                    </Button>
                ]}
            >
                <div className="p-3 bg-[#F7FAF9]">
                    <div><span className="inline-block w-24">用户：</span>{currentSession?.userNickname}</div>
                    <div><span className="inline-block w-24">开始时间：</span>{currentSession?.startedAt}</div>
                    <div><span className="inline-block w-24">消息数：</span>{currentSession?.messageCount}条</div>
                </div>
                <div className="text-lg my-4">对话记录</div>
                <div>
                    {currentDetail.map((detail) => (
                        <div key={detail.id} className={`${detail.senderType === 1 ? 'bg-[#E9F4FB]' : 'bg-[#F0FAEE]'} p-3 mb-3 rounded-lg`}>
                            <div className={`rounded-lg flex items-center justify-between mb-2`}>
                                <div>{detail.senderTypeDesc}</div>
                                <div className="text-sm text-gray-500">{detail.createdAt}</div>
                            </div>
                            <div className="text-gray-600">{detail.content}</div>
                        </div>
                    ))}
                </div>
            </Modal >
        </>
    )
}
