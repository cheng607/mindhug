import { apiBaseUrl } from '../config'

/** 下载需鉴权的 CSV/文件流（Cookie 会话） */
export async function downloadAuthenticatedFile(path: string, filename: string): Promise<void> {
    const resp = await fetch(`${apiBaseUrl}${path}`, {
        credentials: 'include',
    })
    if (!resp.ok) {
        throw new Error('导出失败，请稍后重试')
    }
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}
