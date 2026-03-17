import { Button, Form, Input, Row, Select } from "antd";
import { type articleParamsType, type categoryType } from "../types/articleType";

interface CategoryProps {
    categories: categoryType[],
    onSearch: (params: articleParamsType) => void
}

export default function TableSearch(props: CategoryProps) {
    const [form] = Form.useForm()
    const { categories, onSearch } = props
    const categoryOptions = categories.map((item) => ({
        label: item.categoryName,
        value: item.id
    }))
    const searchArticle = async (values: articleParamsType) => {
        const articleParams = {
            ...values,
            authorName: '',
            currentPage: '',
            size: ''
        }
        onSearch(articleParams)
    }
    return (
        <>
            <Form
                className="flex flex-col"
                onFinish={searchArticle}
                form={form}
            >
                <Row className="flex items-center gap-5">
                    <Form.Item className="w-80" label="文章标题" name="title">
                        <Input placeholder={'请输入文章标题'} />
                    </Form.Item>
                    <Form.Item className="w-72" label="分类" name="categoryId">
                        <Select placeholder={'请选择分类'} options={[
                            { label: '全部', value: '' },
                            ...categoryOptions
                        ]} />
                    </Form.Item>
                    <Form.Item className="w-72" label="状态" name="status">
                        <Select placeholder={'请选择状态'} options={[
                            { label: '未发布', value: '0' },
                            { label: '已发布', value: '1' },
                        ]} />
                    </Form.Item>
                </Row>
                <div className="flex items-center gap-3">
                    <Button type="primary" htmlType="submit" >查询</Button>
                    <Button onClick={() => { form.resetFields() }}>重置</Button>
                </div>
            </Form>
        </>
    )
}
