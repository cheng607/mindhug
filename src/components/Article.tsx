import { useParams } from 'react-router-dom'
import { BookOutlined, ContainerOutlined, UserOutlined, FireOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getArticleDetail } from '../apis/article';
import type { articleType } from '../types/articleType';

export default function Article() {
    const { id } = useParams<{ id: string }>()
    const [article, setArticle] = useState<articleType>()
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await getArticleDetail(id || '')
                console.log(res)
                setArticle(res.data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchArticle()
    }, [id])
    return (
        <div className='bg-gray-100 min-h-screen'>
            <div className='w-full h-28 flex items-center bg-gradient-to-r from-[#DE9C3E] to-[#8A63DE] px-10 gap-4'>
                <BookOutlined className='text-white text-3xl' />
                <div className='text-3xl text-white font-bold'>知识文章详情</div>
            </div>
            <div className='w-3/5 mx-auto p-5'>
                <div className='bg-white p-5 rounded-lg shadow-md mb-4'>
                    <div className='text-xl font-semibold mb-3'>文章信息</div>
                    <div className='flex items-center gap-3 text-xs'>
                        {article?.categoryName ? (
                            <span className='bg-blue-100 text-blue-400 text-xs px-2 py-1 rounded'>{article.categoryName}</span>
                        ) : ''}
                        <div><ContainerOutlined />{article?.publishedAt}</div>
                    </div>
                    <div className='text-xl font-bold my-4'>{article?.title}</div>
                    <div className='bg-green-100 border-l-green-400 border-l-4 p-2'>{article?.summary}</div>
                    <div className='flex items-center gap-3 text-sm mt-4'>
                        <div><UserOutlined /> {article?.authorName} </div>
                        <div><FireOutlined /> {article?.readCount} 次阅读</div>
                    </div>
                </div>
                {/* 文章内容 */}
                <div className='bg-white p-5 rounded-lg shadow-md'>
                    <div className='text-xl font-semibold mb-3'>正文内容</div>
                    {article?.content && (
                        <div className='mt-5 p-5' dangerouslySetInnerHTML={{ __html: article.content }} />
                    )}
                    {/* 相关标签 */}
                    <div className='flex flex-wrap gap-2 mt-4'>
                        {article?.tags?.split(',').map((tag, index) => (
                            <span key={index} className='bg-blue-100 text-blue-400 text-xs px-2 py-1 rounded'>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
