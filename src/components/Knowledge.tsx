import { useEffect, useState } from "react"
import { getCategory, getArticle, getArticleById, deleteArticle, updateArticleStatus } from "../apis/article"
import type { articleData, articleType, categoryType, articleParamsType } from "../types/articleType"
import { Button, Divider, Table, Space, message } from "antd";
import { formatDateTime } from "../utils";
import TableSearch from "./TableSearch";
import ArticleDialog from "./ArticleDialog";

// 定义表格列的类型（和articleType字段对应）
interface ArticleTableItem {
    key: number | string; // 表格行唯一标识
    title: string; // 文章标题
    categoryName: string; // 分类名称
    author: string; // 作者
    readCount: number; // 阅读量
    publishedAt: string; // 发布时间
    status: number; // 文章状态
    id: string; // 文章ID
}

export default function Knowledge() {
    const [categories, setCategories] = useState<categoryType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [list, setList] = useState<articleType[]>([]); // 初始值改为空数组，避免undefined
    const [total, setTotal] = useState<number>(0); // 新增：总条数状态
    const [currentPage, setCurrentPage] = useState<number>(1); // 当前页
    const [pageSize, setPageSize] = useState<number>(10); // 每页数量
    const [searchParams, setSearchParams] = useState<articleParamsType>({
        title: '',
        categoryId: '',
        status: '',
        authorName: '',
        currentPage: '1',
        size: '10'
    });
    const [isAdd, setIsAdd] = useState<boolean>(false)
    const [dialogTitle, setDialogTitle] = useState<string>('')
    const [currentArticle, setCurrentArticle] = useState<articleType>();

    // 1. 获取分类列表
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(true); // 开始加载
                const res = await getCategory();
                if (Array.isArray(res.data)) {
                    setCategories(res.data);
                } else {
                    throw new Error("分类数据格式错误，预期是数组");
                }
            } catch (error) {
                console.error("获取分类出错：", error);
                message.error("获取分类失败，请刷新重试");
            } finally {
                setLoading(false); // 结束加载
            }
        };
        fetchCategory();
    }, []);

    // 初始加载文章列表
    useEffect(() => {
        if (categories.length > 0) {
            fetchList({
                title: '',
                categoryId: '',
                status: '',
                authorName: '',
                currentPage: '1', // 设置默认页码
                size: '10' // 设置合理的页面大小
            });
        }
    }, [categories]);

    // 2. 接收子组件传递的查询参数，获取文章列表
    const fetchList = async (articleParams: articleParamsType) => {
        try {
            setLoading(true); // 开始加载
            setSearchParams(articleParams)
            setCurrentPage(Number(articleParams.currentPage || '1'))
            setPageSize(Number(articleParams.size || '10'))

            const res = await getArticle(articleParams);
            const articleData = res.data as articleData;
            if (articleData?.records) {
                setList(articleData.records);
                setTotal(articleData.total || 0);
            } else {
                setList([]);
                setTotal(0);
                message.warning("暂无文章数据");
            }
        } catch (error) {
            console.error("获取文章列表失败：", error);
            message.error("获取文章失败，请刷新重试");
            setList([]);
            setTotal(0);
        } finally {
            setLoading(false); // 结束加载
        }
    };

    // 刷新当前列表的辅助函数
    const refreshList = () => {
        fetchList({
            title: '',
            categoryId: '',
            status: '',
            authorName: '',
            currentPage: '1',
            size: '10'
        });
    };

    // 3. 映射文章数据为表格所需格式
    const dataSource: ArticleTableItem[] = list.map((item) => {
        // 根据文章的categoryId匹配分类名称
        const category = categories.find(cate => cate.id === item.categoryId);
        return {
            key: item.id,
            title: item.title || "无标题",
            categoryName: category?.categoryName || "未分类",
            author: item.authorName || "未知作者",
            readCount: item.readCount || 0,
            publishedAt: item.publishedAt || "未发布",
            status: item.status,
            id: item.id
        };
    });

    // 4. 定义表格列配置
    const columns = [
        {
            title: '文章标题',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
        },
        {
            title: '分类',
            dataIndex: 'categoryName',
            key: 'categoryName',
            width: 120,
        },
        {
            title: '作者',
            dataIndex: 'author',
            key: 'author',
            width: 100,
        },
        {
            title: '阅读量',
            dataIndex: 'readCount',
            key: 'readCount',
            width: 80,
            align: 'center' as const,
        },
        {
            title: '发布时间',
            dataIndex: 'publishedAt',
            key: 'publishedAt',
            width: 180,
            render: (val: string) => val && val !== '未发布' ? formatDateTime(val) : val,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            align: 'center' as const,
            // 操作按钮组
            render: (_: unknown, record: ArticleTableItem) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        onClick={() => handleEdit(record.id)}
                    >
                        编辑
                    </Button>
                    {record.status === 0 ?
                        <Button
                            type="link"
                            size="small"
                            className="text-green-500"
                            onClick={() => handleStatus(record.id, 1)}
                        >
                            发布
                        </Button> :
                        <Button
                            type="link"
                            size="small"
                            className="text-yellow-500"
                            onClick={() => handleStatus(record.id, 0)}
                        >
                            下线
                        </Button>
                    }
                    <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => handleDelete(record.id)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];
    const handleAdd = () => {
        setDialogTitle("新增文章");
        setCurrentArticle(undefined); // 清空编辑数据
        setIsAdd(true); // 显示弹窗
    };

    // 5. 编辑/删除操作示例
    const handleEdit = async (id: number | string) => {
        try {
            setLoading(true);
            // 调用获取单篇文章的接口
            const res = await getArticleById(id.toString());
            if (res.code === '200') {
                setCurrentArticle(res.data);
                setDialogTitle("编辑文章");
                setIsAdd(true); // 显示弹窗
            } else {
                message.error("获取文章详情失败");
            }
        } catch (error) {
            console.error("获取文章详情失败：", error);
            message.error("编辑失败，请重试");
        } finally {
            setLoading(false);
        }
    };
    // 更新文章状态
    const handleStatus = async (id: string, status: number) => {
        try {
            // 显示确认弹窗
            const statusText = status === 1 ? '发布' : '下架';
            const confirmed = window.confirm(`确认${statusText}该文章？`);
            if (!confirmed) return;

            setLoading(true);
            const res = await updateArticleStatus(id, status);
            if (res.code === '200') {
                message.success(`${statusText}文章成功`);
                // 重新加载列表
                refreshList();
            } else {
                message.error(`${statusText}文章失败`);
            }
        } catch (error) {
            console.error('状态切换失败', error);
            message.error('操作失败，请重试');
        }
    };

    const handleDelete = async (id: number | string) => {
        try {
            // 显示确认弹窗
            const confirmed = window.confirm(`确认删除该文章？`);
            if (!confirmed) return;

            setLoading(true);
            const res = await deleteArticle(id.toString());
            if (res.code === '200') {
                message.success("删除文章成功");
                // 重新加载列表
                refreshList();
            } else {
                message.error("删除文章失败");
            }
        } catch (error) {
            console.error("删除文章失败：", error);
            message.error("删除失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    // 关闭弹窗
    const handleDialogCancel = () => {
        setIsAdd(false);
        setCurrentArticle(undefined);
    };
    return (
        <div style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold">知识文库</div>
                <div className="flex items-center gap-4">
                    <Button type="primary" onClick={handleAdd}>新增</Button>
                    <Button type="primary">批量操作</Button>
                </div>
            </div>
            <Divider />

            {/* 搜索组件：传递分类和查询回调 */}
            <TableSearch onSearch={fetchList} categories={categories} />

            {/* 表格组件：核心使用 */}
            <div style={{ marginTop: '20px' }}>
                <Table
                    dataSource={dataSource}
                    columns={columns}
                    loading={loading} // 加载状态
                    rowKey="key" // 行唯一标识
                    bordered
                    scroll={{ x: 900 }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条数据`,
                        total: total,
                        onChange: (page, size) => {
                            fetchList({
                                ...searchParams,
                                currentPage: page.toString(),
                                size: size.toString()
                            });
                        }
                    }}
                    locale={{ emptyText: "暂无文章数据" }}
                />
            </div>
            <ArticleDialog
                visible={isAdd}
                onCancel={handleDialogCancel}
                categories={categories}
                title={dialogTitle}
                initialValues={currentArticle}
                onSuccess={refreshList}
            />

        </div>
    )
}