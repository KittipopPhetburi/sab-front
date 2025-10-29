import { apiClient } from './api';

export interface Project {
  id: number;
  code: string;
  name: string;
  customer: string;
  customer_id: number;
  amount: number;
  installments: number;
  guarantee: number;
  start_date: string;
  end_date: string | null;
  description: string | null;
  status: string;
  budget: number;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  code: string;
  customer_id: number;
  name: string;
  amount: number;
  installments: number;
  guarantee?: number;
  start_date: string;
  end_date?: string;
  description?: string;
  status?: string;
}

export interface UpdateProjectData {
  code?: string;
  customer_id?: number;
  name?: string;
  amount?: number;
  installments?: number;
  guarantee?: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  status?: string;
}

class ProjectService {
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  }

  async getById(id: number): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  }

  async create(data: CreateProjectData): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  }

  async update(id: number, data: UpdateProjectData): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  }
}

export const projectService = new ProjectService();
