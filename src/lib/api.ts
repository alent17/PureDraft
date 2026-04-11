/**
 * PureDraft API 客户端
 * 用于与后端服务通信
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface FileInfo {
  name: string;
  content: string;
  path: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * API 请求封装
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 健康检查
 */
export async function checkHealth(): Promise<boolean> {
  const response = await request('/health');
  return response.success;
}

/**
 * 读取文件
 */
export async function readFile(path: string): Promise<FileInfo | null> {
  const encodedPath = encodeURIComponent(path);
  const response = await request<FileInfo>(`/files/read/${encodedPath}`);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  console.error('Failed to read file:', response.error);
  return null;
}

/**
 * 写入文件
 */
export async function writeFile(path: string, content: string): Promise<FileInfo | null> {
  const response = await request<FileInfo>('/files/write', {
    method: 'POST',
    body: JSON.stringify({ path, content }),
  });
  
  if (response.success && response.data) {
    return response.data;
  }
  
  console.error('Failed to write file:', response.error);
  return null;
}

/**
 * 保存文件
 */
export async function saveFile(path: string, content: string): Promise<FileInfo | null> {
  return writeFile(path, content);
}

/**
 * 列出 Markdown 文件
 */
export async function listFiles(directory?: string): Promise<FileInfo[]> {
  const endpoint = directory 
    ? `/files/list?path=${encodeURIComponent(directory)}`
    : '/files/list';
  
  const response = await request<FileInfo>(endpoint);
  
  if (response.success && response.data) {
    return [response.data];
  }
  
  return [];
}

export default {
  checkHealth,
  readFile,
  writeFile,
  saveFile,
  listFiles,
};
