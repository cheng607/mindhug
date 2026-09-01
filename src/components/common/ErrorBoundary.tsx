import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info.componentStack)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <Result
                        status="error"
                        title="页面出错了"
                        subTitle={this.state.error?.message || '发生了未知错误，请刷新页面重试'}
                        extra={
                            <Button type="primary" onClick={this.handleReset}>
                                返回首页
                            </Button>
                        }
                    />
                </div>
            )
        }
        return this.props.children
    }
}
