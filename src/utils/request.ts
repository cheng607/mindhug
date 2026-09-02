import axios from 'axios';
import type {
    AxiosInstance,
    AxiosError,
    AxiosRequestConfig
} from 'axios';
import type { ApiResponse } from '../types/userType';
import { apiBaseUrl } from '../config';
import { useUserStore } from '../store/userStore';

const service: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    timeout: 30000,
    withCredentials: true,
});

service.interceptors.request.use(
    (config) => {
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

const handleUnauthorized = () => {
    useUserStore.getState().clearUserInfo();
    if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
    }
};

service.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const data = error.response?.data as ApiResponse | undefined;
        if (data?.code === '401') {
            handleUnauthorized();
        }
        const errMsg = data?.msg || error.message || '服务器异常';
        console.error('Network Error:', errMsg);
        return Promise.reject(new Error(errMsg));
    }
);

export const request = {
    async get<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.get<ApiResponse<T>>(url, { params, ...config });
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') handleUnauthorized();
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.post<ApiResponse<T>>(url, data, config);
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') handleUnauthorized();
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.put<ApiResponse<T>>(url, data, config);
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') handleUnauthorized();
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    async delete<T = unknown>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const resp = await service.delete<ApiResponse<T>>(url, { params, ...config });
        const res = resp.data;
        if (res.code !== '200') {
            if (res.code === '401') handleUnauthorized();
            return Promise.reject(new Error(res.msg || '请求失败'));
        }
        return res as T;
    },
    raw: service,
};

export default service;
