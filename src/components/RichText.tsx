import '@wangeditor/editor/dist/css/style.css'
import { useState, useEffect } from 'react'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

// 组件间通信
interface RichTextProps {
    placeholder?: string;
    onChange?: (html: string) => void;
    onCreated?: (editor: IDomEditor) => void;
}
function RichText({ placeholder, onChange }: RichTextProps) {
    // editor 实例
    const [editor, setEditor] = useState<IDomEditor | null>(null)
    // 编辑器内容
    const [html, setHtml] = useState('')
    // 工具栏配置
    const toolbarConfig: Partial<IToolbarConfig> = {}
    // 编辑器配置
    const editorConfig: Partial<IEditorConfig> = {
        placeholder: placeholder,
    }
    // 及时销毁 editor ，重要！
    useEffect(() => {
        return () => {
            if (editor == null) return
            editor.destroy()
            setEditor(null)
        }
    }, [editor])

    // 编辑器内容变化时，通知父组件
    const handleChange = (editor: IDomEditor) => {
        const newHtml = editor.getHtml();
        setHtml(newHtml);
        if (typeof onChange === 'function') {
            onChange(newHtml);
        }
    };

    return (
        <>
            <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
                <Toolbar
                    editor={editor}
                    defaultConfig={toolbarConfig}
                    mode="default"
                    style={{ borderBottom: '1px solid #ccc' }}
                />
                <Editor
                    defaultConfig={editorConfig}
                    value={html}
                    onCreated={setEditor}
                    onChange={handleChange}
                    mode="default"
                    style={{ height: '400px', overflowY: 'hidden' }}
                />
            </div>
        </>
    )
}

export default RichText