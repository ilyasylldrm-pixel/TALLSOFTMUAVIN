import React from "react";
import { DashboardAmortismanTable } from "./DashboardAmortismanTable";
import {
  Contact,
  Invoice,
  Account,
  Transaction,
  CompanySettings,
} from "../types";

interface DashboardProps {
  contacts: Contact[];
  invoices: Invoice[];
  accounts: Account[];
  transactions: Transaction[];
  settings: CompanySettings;
  globalSearchTerm?: string;
  onSelectTab: (tab: any) => void;
  onOpenQuickAdd: () => void;
  onOpenAiModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  contacts,
  onSelectTab,
}) => {
  return (
    <div className="w-full animate-in fade-in duration-200">
      <DashboardAmortismanTable contacts={contacts} onSelectTab={onSelectTab} />
    </div>
  );
};
