import type { ApiResponse, LoginParams, LoginResponse, RegisterParams, UserInfoType } from "../types/userType";
import { request } from "../utils/request";
// 登录接口
export const login = async (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
    return request.post("/user/login", params);
}

// 登出接口
export const logout = async (): Promise<ApiResponse<string>> => {
    return request.post('/user/logout')
}

// 注册接口
export const register = async (params: RegisterParams): Promise<ApiResponse<UserInfoType>> => {
    return request.post('/user/add', params)
}

export const getMe = async (): Promise<ApiResponse<UserInfoType>> => {
    return request.get('/user/me')
}

export interface UpdateProfileParams {
    nickname?: string
    phone?: string
    gender?: number
}

export const updateProfile = async (params: UpdateProfileParams): Promise<ApiResponse<UserInfoType>> => {
    return request.put('/user/profile', params)
}

export interface ChangePasswordParams {
    oldPassword: string
    newPassword: string
    confirmPassword: string
}

export const changePassword = async (params: ChangePasswordParams): Promise<ApiResponse<null>> => {
    return request.put('/user/password', params)
}

export const forgotPassword = async (email: string): Promise<ApiResponse<null>> => {
    return request.post('/user/forgot-password', { email })
}

export interface ResetPasswordParams {
    token: string
    newPassword: string
    confirmPassword: string
}

export const resetPassword = async (params: ResetPasswordParams): Promise<ApiResponse<null>> => {
    return request.post('/user/reset-password', params)
}