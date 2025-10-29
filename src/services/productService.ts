import { apiClient } from './api';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  type: string | null;
  category_id: number | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  purchase_price: number;
  sale_price: number;
  description: string | null;
  status: 'active' | 'inactive';
  // Legacy field for backward compatibility
  price: number;
  stock: number | null;
}

export interface CreateProductData {
  code: string;
  name: string;
  type?: string | null;
  category_id?: number | null;
  quantity?: number | null;
  unit?: string | null;
  purchase_price?: number;
  sale_price?: number;
  description?: string | null;
  status: 'active' | 'inactive';
}

export interface UpdateProductData {
  code?: string;
  name?: string;
  type?: string | null;
  category_id?: number | null;
  quantity?: number | null;
  unit?: string | null;
  purchase_price?: number;
  sale_price?: number;
  description?: string | null;
  status?: 'active' | 'inactive';
}

class ProductService {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  }

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  }

  async create(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  }

  async update(id: number, data: UpdateProductData): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/products/${id}`);
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  }
}

export const productService = new ProductService();
