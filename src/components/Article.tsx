import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined, BookOutlined, ContainerOutlined, FireOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getArticleDetail } from '../apis/article';
import type { articleType } from '../types/articleType';
import PageHero from './common/PageHero';
import Loading from './common/Loading';
import { formatDateTime } from '../utils';

export default function Article() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [article, setArticle] = useState<articleType>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true)
                const res = await getArticleDetail(id || '')
                setArticle(res.data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchArticle()
    }, [id])

    if (loading) return <Loading tip="加载文章..." />

    return (
        <div className="flex flex-1 flex-col bg-slate-50 pb-10">
            <PageHero
                icon={<BookOutlined />}
                title="知识文章"
                subtitle={article?.categoryName || '心理健康科普'}
                gradient="from-[#DE9C3E] to-[#8A63DE]"
            />
            <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
                <button
                    type="button"
                    className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#8A63DE]"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeftOutlined /> 返回
                </button>

                <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {article?.categoryName && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{article.categoryName}</span>
                        )}
                        <span><ContainerOutlined className="mr-1" />{formatDateTime(article?.publishedAt || '')}</span>
                    </div>
                    <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">{article?.title}</h1>
                    {article?.summary && (
                        <div className="mb-4 rounded-lg border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-gray-700">
                            {article.summary}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span><UserOutlined className="mr-1" />{article?.authorName}</span>
                        <span><FireOutlined className="mr-1" />{article?.readCount} 次阅读</span>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">正文内容</h2>
                    {article?.content && (
                        <div
                            className="article-content leading-relaxed text-gray-700"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />
                    )}
                    {article?.tags && (
                        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            {article.tags.split(',').filter(Boolean).map((tag, index) => (
                                <span key={index} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-600">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <Link to="/knowledgeBase" className="text-sm text-[#8A63DE] hover:underline">
                        浏览更多知识文章 →
                    </Link>
                </div>
            </div>
        </div>
    )
}
