/**
 * API 请求基础配置
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * 请求重试配置
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // 毫秒
    retryableStatuses: [408, 429, 500, 502, 503, 504]
};

/**
 * 请求缓存（简单的内存缓存）
 */
const requestCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

/**
 * 延迟函数
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 请求拦截器 - 添加认证 token 等
 */
const requestInterceptor = (config) => {
    // 可以从 localStorage 或其他地方获取 token
    const token = localStorage.getItem('authToken');
    
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    
    return config;
};

/**
 * 响应拦截器 - 统一错误处理
 */
const responseInterceptor = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    return response;
};

/**
 * 带重试的请求处理
 */
const requestWithRetry = async (endpoint, options = {}, retryCount = 0) => {
    try {
        const config = requestInterceptor({
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            }
        });

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const processedResponse = await responseInterceptor(response);
        return await processedResponse.json();
    } catch (error) {
        // 检查是否应该重试
        const shouldRetry = 
            retryCount < RETRY_CONFIG.maxRetries &&
            (error.status && RETRY_CONFIG.retryableStatuses.includes(error.status)) ||
            (!error.status && error.message.includes('fetch'));

        if (shouldRetry) {
            await delay(RETRY_CONFIG.retryDelay * (retryCount + 1));
            return requestWithRetry(endpoint, options, retryCount + 1);
        }
        
        // 开发环境输出错误，生产环境可以上报到错误监控服务
        if (import.meta.env.DEV) {
            console.error('API request failed:', error);
        }
        
        throw error;
    }
};

/**
 * 统一的请求处理
 * @param {string} endpoint - API端点
 * @param {Object} options - 请求配置
 * @param {boolean} useCache - 是否使用缓存
 * @returns {Promise} Promise对象
 */
const request = async (endpoint, options = {}, useCache = false) => {
    // 检查缓存
    if (useCache && options.method === 'GET') {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        const cached = requestCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
    }

    // 创建 AbortController 支持请求取消
    const abortController = new AbortController();
    const signal = options.signal || abortController.signal;

    try {
        const data = await requestWithRetry(endpoint, { ...options, signal });
        
        // 缓存 GET 请求结果
        if (useCache && options.method === 'GET') {
            const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
            requestCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }
        
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request aborted:', endpoint);
        }
        throw error;
    }
};

/**
 * 清除缓存
 */
export const clearCache = () => {
    requestCache.clear();
};

/**
 * 博客相关 API
 */
export const blogApi = {
    // 获取博客列表
    getList: (params = {}, useCache = true) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/api/blogs?${queryString}`, { method: 'GET' }, useCache);
    },

    // 获取博客详情
    getDetail: (id, useCache = true) => {
        return request(`/api/blogs/${id}`, { method: 'GET' }, useCache);
    },
};

/**
 * 项目相关 API
 */
export const projectApi = {
    // 获取项目列表
    getList: (useCache = true) => {
        return request('/api/projects', { method: 'GET' }, useCache);
    },

    // 获取项目详情
    getDetail: (id, useCache = true) => {
        return request(`/api/projects/${id}`, { method: 'GET' }, useCache);
    },
}; 