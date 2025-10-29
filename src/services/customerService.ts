import { apiClient } from './api';

export interface Customer {
  id: number;
  code: string;
  name: string;
  type: '%9I2' | '9HI2' | '1I9HI2A%0%9I2';
  branch_name?: string;
  tax_id?: string;
  contact_person?: string;
  phone: string;
  email: string;
  address?: string;
  note?: string;
  account_name?: string;
  bank_account?: string;
  bank_name?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  code: string;
  name: string;
  type: '%9I2' | '9HI2' | '1I9HI2A%0%9I2';
  branch_name?: string;
  tax_id?: string;
  contact_person?: string;
  phone: string;
  email: string;
  address?: string;
  note?: string;
  account_name?: string;
  bank_account?: string;
  bank_name?: string;
  status: 'active' | 'inactive';
}

export interface UpdateCustomerData {
  code?: string;
  name?: string;
  type?: '%9I2' | '9HI2' | '1I9HI2A%0%9I2';
  branch_name?: string;
  tax_id?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  account_name?: string;
  bank_account?: string;
  bank_name?: string;
  status?: 'active' | 'inactive';
}

class CustomerService {
  async getAll(): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>('/customers');
    return response.data;
  }

  async getById(id: number): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', data);
    return response.data;
  }

  async update(id: number, data: UpdateCustomerData): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/customers/${id}`);
    return response.data;
  }

  async getActiveCustomers(): Promise<Customer[]> {
    const customers = await this.getAll();
    return customers.filter(c => c.status === 'active');
  }
}

export const customerService = new CustomerService();
