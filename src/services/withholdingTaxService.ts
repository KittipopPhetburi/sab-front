import { apiClient } from './api';

// Types
export interface TaxIncomeItem {
  id?: string | number;
  type: string;
  description: string;
  date: string;
  tax_rate: number;
  amount: number;
  tax_amount: number;
}

export interface WithholdingTax {
  id?: string | number;
  doc_number: string;
  doc_date: string;
  sequence_number: string;
  payer_tax_id: string;
  payer_name: string;
  recipient_tax_id: string;
  recipient_name: string;
  recipient_address: string;
  recipient_type: 'individual' | 'juristic' | 'partnership' | 'other';
  company_type?: '1' | '2' | '3' | '4' | '5' | 'other';
  items: TaxIncomeItem[];
  total_amount: number;
  total_tax: number;
  status: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  created_by: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWithholdingTaxData {
  doc_number: string;
  doc_date: string;
  sequence_number: string;
  payer_tax_id: string;
  payer_name: string;
  recipient_tax_id: string;
  recipient_name: string;
  recipient_address: string;
  recipient_type: 'individual' | 'juristic' | 'partnership' | 'other';
  company_type?: '1' | '2' | '3' | '4' | '5' | 'other';
  items: Omit<TaxIncomeItem, 'id'>[];
  total_amount: number;
  total_tax: number;
  status: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก';
  created_by: string;
  notes?: string;
}

// API Service
class WithholdingTaxService {
  private endpoint = '/withholding-taxes';

  // Get all withholding taxes
  async getAll(): Promise<WithholdingTax[]> {
    const response = await apiClient.get<WithholdingTax[]>(this.endpoint);
    return response.data;
  }

  // Get single withholding tax by ID
  async getById(id: string | number): Promise<WithholdingTax> {
    const response = await apiClient.get<WithholdingTax>(`${this.endpoint}/${id}`);
    return response.data;
  }

  // Create new withholding tax
  async create(data: CreateWithholdingTaxData): Promise<{ message: string; data: WithholdingTax }> {
    const response = await apiClient.post<{ message: string; data: WithholdingTax }>(this.endpoint, data);
    return response.data;
  }

  // Update withholding tax
  async update(id: string | number, data: CreateWithholdingTaxData): Promise<{ message: string; data: WithholdingTax }> {
    const response = await apiClient.put<{ message: string; data: WithholdingTax }>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  // Delete withholding tax
  async delete(id: string | number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.endpoint}/${id}`);
    return response.data;
  }

  // Update status only
  async updateStatus(
    id: string | number,
    status: 'ร่าง' | 'รออนุมัติ' | 'อนุมัติแล้ว' | 'ยกเลิก',
    currentData: WithholdingTax
  ): Promise<{ message: string; data: WithholdingTax }> {
    // Since Laravel doesn't have a separate status update endpoint,
    // we'll update the entire record with the new status
    const updateData: CreateWithholdingTaxData = {
      doc_number: currentData.doc_number,
      doc_date: currentData.doc_date,
      sequence_number: currentData.sequence_number,
      payer_tax_id: currentData.payer_tax_id,
      payer_name: currentData.payer_name,
      recipient_tax_id: currentData.recipient_tax_id,
      recipient_name: currentData.recipient_name,
      recipient_address: currentData.recipient_address,
      recipient_type: currentData.recipient_type,
      company_type: currentData.company_type,
      items: currentData.items.map(item => ({
        type: item.type,
        description: item.description,
        date: item.date,
        tax_rate: item.tax_rate,
        amount: item.amount,
        tax_amount: item.tax_amount,
      })),
      total_amount: currentData.total_amount,
      total_tax: currentData.total_tax,
      status: status,
      created_by: currentData.created_by,
      notes: currentData.notes,
    };

    return this.update(id, updateData);
  }
}

export const withholdingTaxService = new WithholdingTaxService();
