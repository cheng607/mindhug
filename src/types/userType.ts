export interface ApiResponse<T = unknown> {
    code: string;
    data: T;
    msg?: string;
    message?: string;
    success: boolean;
}
export interface LoginParams {
    username: string,
    password: string
}
// userInfo信息
export interface UserInfoType {
    id: number,
    username: string,
    email: string,
    nickname: string,
    avatar: string,
    phone: string,
    gender: number,
    genderDisplayName: string,
    birthday: string,
    userType: number,
    userTypeDisplayName: string,
    status: number,
    statusDisplayName: string,
    displayName: string,
    createdAt: string,
    updatedAt: string
}

// 注册信息
export interface RegisterParams {
    username: string,
    email: string,
    nickname?: string,
    phone?: string,
    password: string,
    confirmPassword: string,
    gender: number, // 1 男 2 女
    userType: number,    // 权限（默认传1）
    agreeTerms: boolean,
}

export interface LoginResponse {
    userInfo: UserInfoType,
    token: string,
    roleType: string
}