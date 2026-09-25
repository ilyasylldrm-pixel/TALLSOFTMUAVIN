import React from "react";
import { Invoice, CompanySettings, Contact } from "../types";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import { NavItem } from "./Sidebar";

interface InvoicePrintModalProps {
  invoice: Invoice;
  companySettings: CompanySettings;
  contact?: Contact;
  onClose: () => void;
  onSelectTab?: (tab: NavItem) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  companySettings,
  contact,
  onClose,
  onSelectTab,
}) => {
  return (
    <InvoicePreviewModal
      invoice={invoice}
      companySettings={companySettings}
      contact={contact}
      onClose={onClose}
      onSelectTab={onSelectTab}
    />
  );
};
