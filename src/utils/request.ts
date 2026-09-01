import axios from 'axios';
import type {
    AxiosInstance,
    AxiosError,
    AxiosRequestConfig
} from 'axios';
import type { ApiResponse } from '../types/userType';
import { apiBaseUrl } from '../config';

// 1. 创建 Axios 实例
const service: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: 30000,
    withCredentials: true
});

// 2. 请求拦截器
service.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['token'] = token;
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
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
        const data = error.response?.data as ApiResponse | undefined;
        if (data?.code === '401') {
            localStorage.removeItem('token');
            window.location.href = '/auth';
        }
        const errMsg = data?.msg || error.message || '服务器异常';
        console.error('Network Error:', errMsg);
        return Promise.reject(new Error(errMsg));
    }
);

// 4. 封装通用请求方法，并在此处解析后端标准返回格式
export const request = {
    async get<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.get<ApiResponse<T>>(url, { params, ...config });
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
    async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.post<ApiResponse<T>>(url, data, config);
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
    async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.put<ApiResponse<T>>(url, data, config);
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
    async delete<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.delete<ApiResponse<T>>(url, { params, ...config });
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
    raw: service,
};

export default service;
