// ArticleDialog.tsx
import { Form, Input, message, Modal, Select, Upload } from "antd";
import type { addArticleType, articleType, categoryType } from "../types/articleType";
import { useState } from "react";
import { uploadFile } from "../apis/other";
import { fileBaseUrl } from "../config/index";
// 定义弹窗接收的属性
interface ArticleDialogProps {
    visible: boolean; // 弹窗显隐状态
    onCancel: () => void; // 关闭弹窗回调
    onSubmit: (values: addArticleType) => void; // 提交表单回调
    categories: categoryType[]; // 分类列表
    title?: string; // 弹窗标题
    initialValues: articleType; // 编辑时的初始值
}

const { Option } = Select;
const { TextArea } = Input;

export default function ArticleDialog({
    visible,
    onCancel,
    onSubmit,
    categories,
    title = "新增文章",
    initialValues,
}: ArticleDialogProps) {
    const [form] = Form.useForm(); // 获取表单实例
    const [uploadImg, setUploadImg] = useState<string>('')
    // 弹窗确认提交
    const handleOk = () => {
        form.validateFields().then((values) => {
            onSubmit(values); // 传递表单值给父组件
            form.resetFields(); // 重置表单
            onCancel(); // 关闭弹窗
        }).catch((error) => {
            console.error("表单校验失败：", error);
        });
    };

    // 弹窗取消
    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };
    // 标签选项
    const commonTags = [
        { label: '情绪管理', value: '情绪管理' },
        { label: '焦虑', value: '焦虑' },
        { label: '抑郁', value: '抑郁' },
        { label: '压力', value: '压力' },
        { label: '睡眠', value: '睡眠' },
        { label: '冥想', value: '冥想' },
        { label: '正念', value: '正念' },
        { label: '放松', value: '放松' },
        { label: '心理健康', value: '心理健康' },
        { label: '自我成长', value: '自我成长' },
        { label: '人际关系', value: '人际关系' },
        { label: '工作压力', value: '工作压力' },
        { label: '学习方法', value: '学习方法' },
        { label: '生活技巧', value: '生活技巧' }
    ];
    // 处理图片上传
    const handleUploadRequest = async (options) => {
        const { file, onError, onProgress } = options;
        const businessId = crypto.randomUUID() // 生成唯一的业务ID
        try {
            console.log('上传文件:', file);
            console.log('生成的businessId:', businessId);

            // 模拟进度
            if (onProgress) {
                onProgress({ percent: 0 });
                setTimeout(() => onProgress({ percent: 50 }), 500);
            }

            const res = await uploadFile(file, businessId);

            // 上传成功后更新状态和表单字段
            if (res.code == '200') {
                setUploadImg(`${fileBaseUrl}${res.data?.filePath}`);
                form.setFieldsValue({ coverImage: res.data?.filePath });
                message.success('图片上传成功！');
            } else {
                throw new Error('上传失败：未返回图片URL');
            }
        } catch (error) {
            console.error('上传失败', error);
            message.error('图片上传失败，请重试！');
            if (onError) onError(error);
        }
    }
    // 移除封面
    const handleRemove = () => {
        setUploadImg('');
        form.setFieldsValue({ coverImage: '' });
    }
    return (
        <Modal
            title={title}
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            width={800}
        >
            <Form
                form={form}
                initialValues={initialValues || {}}
                labelCol={{ sm: { span: 3 } }}
            >
                {/* 文章标题 */}
                <Form.Item
                    label="文章标题"
                    name="title"
                    rules={[{ required: true, message: "请输入文章标题" }]}
                    className="mb-5"
                >
                    <Input placeholder="请输入文章标题" count={{ show: true, max: 200 }} />
                </Form.Item>

                {/* 分类选择 */}
                <Form.Item
                    label="所属分类"
                    name="categoryId"
                    rules={[{ required: true, message: "请选择所属分类" }]}
                    className="mb-5"
                >
                    <Select placeholder="请选择分类">
                        {categories.map((cate) => (
                            <Option key={cate.id} value={cate.id}>
                                {cate.categoryName}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Form.Item
                    label="文章摘要"
                    name="summary"
                    className="mb-5"
                >
                    <TextArea
                        placeholder="请输入文章摘要（可选）"
                        count={{ show: true, max: 1000 }}
                        className="min-h-24"
                    />
                </Form.Item>
                <Form.Item
                    label="标签"
                    name="tags"
                    className="mb-5"
                >
                    <Select
                        mode="multiple"
                        placeholder="请输入或选择文章标签"
                        options={commonTags}
                        allowClear

                    />
                </Form.Item>
                <Form.Item
                    label="封面图片"
                    name="coverImage"
                    className="mb-5"
                >
                    <Upload
                        name="coverImage"
                        accept="image/*"
                        className="avatar-uploader"
                        showUploadList={false}
                        action="#"
                        beforeUpload={(file) => {
                            const isImage = file.type.startsWith('image/');
                            const isLt5M = file.size / 1024 / 1024 < 5;
                            if (!isLt5M) {
                                message.error('图片必须小于5MB！');
                                return Upload.LIST_IGNORE;
                            }
                            if (!isImage) {
                                message.error('只能上传图片文件！');
                            }
                            return isImage;
                        }}
                        customRequest={handleUploadRequest}
                    >
                        {uploadImg ? (
                            <>
                                <img src={uploadImg} alt="avatar" className="h-32" />
                                <button onClick={handleRemove}>移除封面</button>
                            </>
                        ) : (
                            <div className="w-52 h-32 flex items-center justify-center cursor-pointer bg-[#F4F9FA] hover:text-gray-600">
                                <p>点击上传封面</p>
                            </div>
                        )}
                    </Upload>
                </Form.Item>
                <Form.Item
                    label="文章内容"
                    name="content"
                    rules={[{ required: true, message: "请输入文章内容" }]}
                >
                    <TextArea rows={6} placeholder="请输入文章内容" />
                </Form.Item>
            </Form>
        </Modal >
    );
}