import { apiClient } from './api';
import type { UserRole } from '../types';

export interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: UserRole;
  role_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  fullname: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  username?: string;
  fullname?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

class UserService {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  }

  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  }

  async create(data: CreateUserData): Promise<{ message: string; data: User }> {
    const response = await apiClient.post<{ message: string; data: User }>('/users', data);
    return response.data;
  }

  async update(id: number, data: UpdateUserData): Promise<{ message: string; data: User }> {
    const response = await apiClient.put<{ message: string; data: User }>(`/users/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  }
}

export const userService = new UserService();
