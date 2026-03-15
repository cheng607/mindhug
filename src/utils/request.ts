import axios from 'axios';
import type {
    AxiosInstance,
    AxiosError,
} from 'axios';
import type { ApiResponse } from '../types/userType';

// 1. 创建 Axios 实例
const service: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
    },
});

// 2. 请求拦截器
service.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['token'] = token
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// 3. 响应拦截器仅处理网络/HTTP错误
service.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const errMsg =
            ((error.response?.data as Record<string, unknown>)?.msg as string) ||
            error.message ||
            '服务器异常';
        console.error('Network Error:', errMsg);
        return Promise.reject(error);
    }
);

// 4. 封装通用请求方法，并在此处解析后端标准返回格式
export const request = {
    async get<T = unknown>(url: string, params?: unknown): Promise<T> {
        const resp = await service.get<ApiResponse<T>>(url, { params });
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') {
                localStorage.removeItem('token');
                window.location.href = '/auth';
            }
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    async post<T = unknown>(url: string, data?: unknown): Promise<T> {
        const resp = await service.post<ApiResponse<T>>(url, data);
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') {
                localStorage.removeItem('token');
                window.location.href = '/auth';
            }
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    async put<T = unknown>(url: string, data?: unknown): Promise<T> {
        const resp = await service.put<ApiResponse<T>>(url, data);
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') {
                localStorage.removeItem('token');
                window.location.href = '/auth';
            }
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    async delete<T = unknown>(url: string, params?: unknown): Promise<T> {
        const resp = await service.delete<ApiResponse<T>>(url, { params });
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') {
                localStorage.removeItem('token');
                window.location.href = '/auth';
            }
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    // 如果需要原始实例，可调用 request.raw
    raw: service,
};

export default service;
