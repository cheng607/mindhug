import { BookOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { articleType } from '../types/articleType';
import { searchArticles } from '../apis/article';
import { UserOutlined, ContainerOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function KnowledgeBase() {
    const [list, setList] = useState<articleType[]>([])
    const [reclist, setReclist] = useState<articleType[]>([])
    useEffect(() => {
        const fetchRecList = async () => {
            try {
                const res = await searchArticles({ currentPage: '1', size: '5', sortDirection: 'desc', sortField: 'readCount' })
                setReclist(res.data.records)
            } catch (error) {
                console.error(error)
            }
        }
        const fetchList = async () => {
            try {
                const res = await searchArticles({ currentPage: '1', size: '10', sortDirection: 'desc', sortField: 'publishedAt' })
                setList(res.data.records)
            } catch (error) {
                console.error(error)
            }
        }

        fetchRecList()
        fetchList()
    }, [])
    const navigate = useNavigate()
    const handleClick = (id: string) => {
        navigate(`/article/${id}`)
    }
    return (
        <div className='bg-gray-100'>
            <div className='w-full h-28 flex items-center bg-gradient-to-r from-[#DE9C3E] to-[#8A63DE] px-10 gap-4'>
                <BookOutlined className='text-white text-3xl' />
                <div className='text-3xl text-white font-bold'>情绪日记</div>
            </div>
            <div className='w-4/5 mx-auto p-5 flex gap-10'>
                {/* 推荐阅读 */}
                <div className='flex flex-col gap-4 w-80 bg-white px-5 rounded-lg shadow-md'>
                    <div className='text-xl font-bold mt-5 mb-3'>推荐阅读</div>
                    <div className='gap-3 flex flex-col mb-5'>
                        {reclist.map(item => (
                            <div key={item.id} className='flex flex-col  border border-gray-200 rounded-lg p-2 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amber-600'>
                                <div className='text-lg font-semibold mb-2'>{item.title}</div>
                                <div>阅读量：{item.readCount}</div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* 文章列表 */}
                <div className='p-8 w-4/5 flex flex-col gap-3'>
                    {list.map(item => (
                        <div key={item.id} className='flex gap-3 bg-white p-3 rounded-md cursor-pointer' onClick={() => { handleClick(item.id) }}>
                            <img src={`http://159.75.169.224:1235${item.coverImage}`} className='w-52 h-36' />
                            <div className='flex flex-col gap-2'>
                                <div className='flex items-center gap-3 mb-2'>
                                    <div className='text-lg font-semibold'>{item.title}</div>
                                    {item.categoryName ? (
                                        <span className='bg-blue-100 text-blue-400 text-xs px-2 py-1 rounded'>{item.categoryName}</span>
                                    ) : ''}
                                </div>
                                <div><UserOutlined />{item.authorName} </div>
                                <div><ContainerOutlined />{item.publishedAt}</div>
                                <div className='mt-3'><FireOutlined />观看人数：{item.readCount}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
