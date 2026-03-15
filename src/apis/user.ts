import type { ApiResponse, LoginParams, LoginResponse } from "../types/userType";
import { request } from "../utils/request";
// 登录接口
export const login = async (params: LoginParams): Promise<ApiResponse<LoginResponse>> => {
    return request.post("/user/login", params);
}

// 登出接口
export const logout = async (): Promise<ApiResponse<string>> => {
    return request.post('/user/logout')
}