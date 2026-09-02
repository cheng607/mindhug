import { request } from '../utils/request'
import type { ApiResponse } from '../types/userType'

export interface CrisisResource {
    name: string
    phone: string
    available: string
}

export interface CrisisResourcesData {
    hotline: string
    hotlineLabel: string
    resources: CrisisResource[]
    responseTemplate: string
}

export const getCrisisResources = async (): Promise<ApiResponse<CrisisResourcesData>> => {
    return request.get('/legal/crisis-resources')
}
