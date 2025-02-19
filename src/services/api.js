/**
 * API 请求基础配置
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * 统一的请求处理
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求配置
 * @returns {Promise} Promise对象
 */
const request = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

/**
 * 博客相关 API
 */
export const blogApi = {
    // 获取博客列表
    getList: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/api/blogs?${queryString}`);
    },

    // 获取博客详情
    getDetail: (id) => {
        return request(`/api/blogs/${id}`);
    },
};

/**
 * 项目相关 API
 */
export const projectApi = {
    // 获取项目列表
    getList: () => {
        return request('/api/projects');
    },

    // 获取项目详情
    getDetail: (id) => {
        return request(`/api/projects/${id}`);
    },
}; 