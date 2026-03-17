import type { uploadResponseType } from "../types/other";
import type { ApiResponse } from "../types/userType";
import { request } from "../utils/request"

export const uploadFile = (file: File, businessId: string): Promise<ApiResponse<uploadResponseType>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('businessType', 'ARTICLE');
    formData.append('businessId', businessId);
    formData.append('businessField', 'cover');

    return request.post('/file/upload', formData);
}