import { BookOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { articleType } from '../types/articleType';
import { searchArticles } from '../apis/article';
import { UserOutlined, ContainerOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { fileBaseUrl } from '../config';
import PageHero from './common/PageHero';
import Empty from './common/Empty';
import { formatDateTime } from '../utils';

export default function KnowledgeBase() {
    const [list, setList] = useState<articleType[]>([])
    const [reclist, setReclist] = useState<articleType[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true)
                const [recRes, listRes] = await Promise.all([
                    searchArticles({ currentPage: '1', size: '5', sortDirection: 'desc', sortField: 'readCount' }),
                    searchArticles({ currentPage: '1', size: '10', sortDirection: 'desc', sortField: 'publishedAt' }),
                ])
                setReclist(recRes.data.records || [])
                setList(listRes.data.records || [])
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [])

    const navigate = useNavigate()
    const handleClick = (id: string) => {
        navigate(`/article/${id}`)
    }

    return (
        <div className="flex flex-1 flex-col bg-slate-50 pb-10">
            <PageHero
                icon={<BookOutlined />}
                title="知识库"
                subtitle="心理健康科普与自助指南"
                gradient="from-[#DE9C3E] to-[#8A63DE]"
            />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
                <aside className="w-full shrink-0 lg:w-72">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 text-lg font-bold text-gray-800">推荐阅读</div>
                        <div className="flex flex-col gap-2">
                            {reclist.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className="rounded-xl border border-l-4 border-slate-100 border-l-amber-500 p-3 text-left transition hover:border-slate-200 hover:bg-amber-50/40 hover:shadow-sm"
                                    onClick={() => handleClick(item.id)}
                                >
                                    <div className="line-clamp-2 text-sm font-semibold text-gray-800">{item.title}</div>
                                    <div className="mt-1 text-xs text-gray-500">阅读 {item.readCount}</div>
                                </button>
                            ))}
                            {!loading && reclist.length === 0 && (
                                <Empty description="暂无推荐" className="py-4" />
                            )}
                        </div>
                    </div>
                </aside>

                <section className="min-w-0 flex-1">
                    {loading ? (
                        <div className="rounded-2xl bg-white p-8 text-center text-gray-400 shadow-sm">加载中...</div>
                    ) : list.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {list.map(item => (
                                <article
                                    key={item.id}
                                    className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple-200 hover:shadow-md sm:flex-row sm:gap-4"
                                    onClick={() => handleClick(item.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleClick(item.id)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    {item.coverImage && (
                                        <img
                                            src={`${fileBaseUrl}${item.coverImage}`}
                                            alt=""
                                            className="h-36 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-40"
                                        />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-semibold text-gray-800">{item.title}</h2>
                                            {item.categoryName && (
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{item.categoryName}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                            <span><UserOutlined className="mr-1" />{item.authorName}</span>
                                            <span><ContainerOutlined className="mr-1" />{formatDateTime(item.publishedAt)}</span>
                                            <span><FireOutlined className="mr-1" />{item.readCount} 次阅读</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <Empty description="暂无文章" className="rounded-2xl bg-white py-16 shadow-sm" />
                    )}
                </section>
            </div>
        </div>
    )
}
