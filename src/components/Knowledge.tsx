import { useEffect, useState } from "react"
import { getCategory, getArticle } from "../apis/article"
import type { articleData, articleType, categoryType, articleParamsType } from "../types/articleType"
import { Button, Divider, Table, Space, message } from "antd";
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
    id: number | string; // 文章ID（用于操作）
}

export default function Knowledge() {
    const [categories, setCategories] = useState<categoryType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [list, setList] = useState<articleType[]>([]); // 初始值改为空数组，避免undefined
    const [total, setTotal] = useState<number>(0); // 新增：总条数状态
    const [isAdd, setIsAdd] = useState<boolean>(false)
    const [dialogTitle, setDialogTitle] = useState<string>('')
    const [currentArticle, setCurrentArticle] = useState<articleType>();

    // 1. 获取分类列表
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setLoading(false);
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
                setLoading(true);
            }
        };
        fetchCategory();
    }, []);

    // 初始加载文章列表（当分类加载完成后）
    useEffect(() => {
        if (categories.length > 0) {
            fetchList({
                title: '',
                categoryId: '',
                status: '',
                authorName: '',
                currentPage: '',
                size: '1000'
            });
        }
    }, [categories]);

    // 2. 接收子组件传递的查询参数，获取文章列表
    const fetchList = async (articleParams: articleParamsType) => {
        try {
            setLoading(false);
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
            setLoading(true);
        }
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
                    {record.status === 1 ?
                        <Button
                            type="link"
                            size="small"
                            className="text-green-500"
                            onClick={() => handleEdit(record.id)}
                        >
                            发布
                        </Button> :
                        <Button
                            type="link"
                            size="small"
                            className="text-yellow-500"
                            onClick={() => handleEdit(record.id)}
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
        setCurrentArticle(null); // 清空编辑数据
        setIsAdd(true); // 显示弹窗
    };

    // 5. 编辑/删除操作示例
    const handleEdit = (id: number | string) => {
        try {
            setLoading(true);
            // 调用获取单篇文章的接口（需补充实现）
            // const res = await getArticleDetail(id);
            // setCurrentArticle(res.data);
            // 临时模拟：从列表中取对应数据
            const article = list.find(item => item.id === id);
            if (article) {
                setCurrentArticle(article);
                setDialogTitle("编辑文章");
                setIsAdd(true); // 显示弹窗
            } else {
                message.error("未找到该文章数据");
            }
        } catch (error) {
            console.error("获取文章详情失败：", error);
            message.error("编辑失败，请重试");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number | string) => {
        console.log("删除文章：", id);
        // 这里可以添加确认弹窗，再调用删除接口
        message.warning(`确认删除ID为 ${id} 的文章？`);
    };

    const handleDialogSubmit = async () => {
        try {
            setLoading(true);
            if (currentArticle) {
                // 编辑逻辑：调用编辑接口
                // await editArticle({ ...values, id: currentArticle.id });
                message.success("编辑文章成功");
            } else {
                // await addArticle(values);
                message.success("新增文章成功");
            }
            // 重新加载列表
            fetchList({
                title: '',
                categoryId: '',
                status: '',
                authorName: '',
                currentPage: '1',
                size: '10'
            });
        } catch (error) {
            console.error("提交文章失败：", error);
            message.error(currentArticle ? "编辑失败" : "新增失败");
        } finally {
            setLoading(false);
        }
    };

    // 关闭弹窗
    const handleDialogCancel = () => {
        setIsAdd(false);
        setCurrentArticle(null);
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
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条数据`,
                        total: total,
                    }}
                    locale={{ emptyText: "暂无文章数据" }}
                />
            </div>
            <ArticleDialog
                visible={isAdd}
                onCancel={handleDialogCancel}
                onSubmit={handleDialogSubmit}
                categories={categories}
                title={dialogTitle}
                initialValues={currentArticle}
            />

        </div>
    )
}