import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOutlined } from "@ant-design/icons";
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { getAdminSessionMessages, getAdminSessions, exportAdminSessionsCsv } from "../apis/admin";
import type { sessionDetailType, sessionType } from "../types/sessionsType";
import { Button, Modal, Space, Table, Tag, message } from "antd";
import type { TablePaginationConfig } from "antd/es/table";
import { formatDateTime } from "../utils";

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
            title: '用户',
            dataIndex: 'userNickname',
            key: 'userNickname',
            width: 100,
            render: (_: unknown, record: sessionType) => (
                <div className="rounded-full bg-gray-300 w-14 h-14 flex items-center justify-center text-sm">
                    {record.userNickname?.charAt(0) || '?'}
                </div>
            )
        },
        {
            title: '会话主题',
            dataIndex: 'sessionTitle',
            key: 'sessionTitle',
            render: (_: unknown, record: sessionType) => (
                <div className="text-gray-600">
                    <p className="font-medium">{record.sessionTitle}</p>
                    <p className="text-sm text-gray-400 truncate">{record.lastMessageContent}</p>
                </div>
            )
        },
        {
            title: '情绪标签',
            dataIndex: 'emotionTag',
            key: 'emotionTag',
            width: 100,
            render: (tag: string) => tag ? <Tag>{tag}</Tag> : <span className="text-gray-400">-</span>
        },
        {
            title: '消息数',
            dataIndex: 'messageCount',
            key: 'messageCount',
            width: 80,
            align: 'center' as const,
        },
        {
            title: '开始时间',
            dataIndex: 'startedAt',
            key: 'startedAt',
            width: 180,
            align: 'center' as const,
            render: (val: string) => val ? formatDateTime(val) : '-'
        },
        {
            title: '操作',
            key: 'action',
            width: 80,
            align: 'center' as const,
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
            const res = await getAdminSessions({
                currentPage: page.toString(),
                size: size.toString(),
            })
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

    const handleDetail = async (sessionId: string, session: sessionType) => {
        try {
            const res = await getAdminSessionMessages(sessionId);
            setCurrentDetail(res.data)
            setCurrentSession(session)
            setVisible(true);
        } catch (error) {
            console.error(error)
            message.error((error as Error).message || '获取会话详情失败')
        }
    }
    const handleExport = async () => {
        try {
            await exportAdminSessionsCsv()
            message.success('咨询记录已导出')
        } catch (error) {
            message.error((error as Error).message || '导出失败')
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">咨询记录</div>
                <Button onClick={handleExport}>导出 CSV</Button>
            </div>
            <Table
                dataSource={sessionList}
                columns={columns}
                rowKey="id"
                bordered
                loading={loading}
                scroll={{ x: 800 }}
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
                    <div><span className="inline-block w-24">开始时间：</span>{formatDateTime(currentSession?.startedAt || '')}</div>
                    <div><span className="inline-block w-24">消息数：</span>{currentSession?.messageCount}条</div>
                    {currentSession?.emotionTag && (
                        <div><span className="inline-block w-24">情绪标签：</span>{currentSession.emotionTag}</div>
                    )}
                </div>
                <div className="text-lg my-4">对话记录</div>
                <div>
                    {currentDetail.map((detail) => (
                        <div key={detail.id} className={`${detail.senderType === 1 ? 'bg-[#E9F4FB]' : 'bg-[#F0FAEE]'} p-3 mb-3 rounded-lg`}>
                            <div className={`rounded-lg flex items-center justify-between mb-2`}>
                                <div>{detail.senderTypeDesc}</div>
                                <div className="text-sm text-gray-500">{formatDateTime(detail.createdAt)}</div>
                            </div>
                            <div className="text-gray-600">
                                {detail.senderType === 2 ? (
                                    <div className="whitespace-pre-wrap break-words [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                            {detail.content || ''}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <span className="whitespace-pre-wrap">{detail.content}</span>
                                )}
                            </div>
                            {detail.citations && detail.citations.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-orange-200">
                                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <BookOutlined />
                                        <span>参考来源</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {detail.citations.map((cite: { articleId?: string; title: string; url?: string; source?: string }, index: number) => {
                                            const label = cite.source === 'web' ? `《${cite.title}》（网页）` : `《${cite.title}》`
                                            if (cite.url) {
                                                return (
                                                    <a
                                                        key={`web-${cite.url}-${index}`}
                                                        href={cite.url}
                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                        target="_blank"
                                                        rel="noreferrer noopener"
                                                    >
                                                        {label}
                                                    </a>
                                                )
                                            }
                                            if (cite.articleId) {
                                                return (
                                                    <Link
                                                        key={`${cite.articleId}-${index}`}
                                                        to={`/article/${cite.articleId}`}
                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                        target="_blank"
                                                    >
                                                        {label}
                                                    </Link>
                                                )
                                            }
                                            return (
                                                <span key={`cite-${index}`} className="text-xs text-gray-600">{label}</span>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal >
        </>
    )
}
