import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { companySettingService } from '../services/companySettingService';
import type { CompanySetting } from '../services/companySettingService';

interface CompanySettingsContextType {
  settings: CompanySetting | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getVatRate: () => number;
  getCompanyInfo: () => {
    name: string;
    branch: string;
    taxId: string;
    address: string;
    phone: string;
    email: string;
  };
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

export const CompanySettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySetting | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      const data = await companySettingService.get();
      setSettings(data);
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const getVatRate = () => {
    return settings?.vat_rate || 7;
  };

  const getCompanyInfo = () => {
    return {
      name: settings?.company_name || '',
      branch: settings?.branch_name || '',
      taxId: settings?.tax_id || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
    };
  };

  return (
    <CompanySettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        getVatRate,
        getCompanyInfo,
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  );
};

export const useCompanySettings = () => {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error('useCompanySettings must be used within a CompanySettingsProvider');
  }
  return context;
};
