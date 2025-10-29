import { apiClient } from './api';

export interface Category {
  id: number;
  code: string;
  name: string;
  type: 'สินค้า' | 'บริการ';
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  code: string;
  name: string;
  type: 'สินค้า' | 'บริการ';
}

export interface UpdateCategoryData {
  code?: string;
  name?: string;
  type?: 'สินค้า' | 'บริการ';
}

class CategoryService {
  async getAll(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  }

  async getById(id: number): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async create(data: CreateCategoryData): Promise<{ message: string; data: Category }> {
    const response = await apiClient.post<{ message: string; data: Category }>('/categories', data);
    return response.data;
  }

  async update(id: number, data: UpdateCategoryData): Promise<{ message: string; data: Category }> {
    const response = await apiClient.put<{ message: string; data: Category }>(`/categories/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/categories/${id}`);
    return response.data;
  }
}

export const categoryService = new CategoryService();
