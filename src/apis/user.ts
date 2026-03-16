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