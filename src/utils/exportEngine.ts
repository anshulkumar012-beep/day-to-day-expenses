import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Account, AppSettings, Category, FinancialSummary, Profile, Transaction } from '../types';
import { formatCurrency } from './i18n';

interface ExportContext {
  profileLabel: string;
  periodLabel: string;
  settings: AppSettings;
  summary: FinancialSummary;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  profiles: Profile[];
}

/**
 * Generate and trigger download of a genuine, multi-page PDF Financial Report
 */
export function exportToPDF(context: ExportContext): void {
  const { profileLabel, periodLabel, settings, summary, transactions, categories, accounts, profiles } = context;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));
  const profMap = new Map(profiles.map((p) => [p.id, p.name]));

  // Brand Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Day-to-day Expenses', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Financial & Expense Statement', 14, 23);

  const timestamp = new Date().toLocaleString();
  doc.setFontSize(8);
  doc.text(`Generated: ${timestamp}`, 196, 23, { align: 'right' });

  // Metadata block
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT DETAILS', 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Scope Profile: ${profileLabel}`, 14, 46);
  doc.text(`Period: ${periodLabel}`, 14, 52);
  doc.text(`Currency: ${settings.currency}`, 14, 58);

  // Financial KPI Cards Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, 36, 86, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INCOME', 115, 42);
  doc.text('TOTAL EXPENSES', 115, 49);
  doc.text('NET CASH FLOW', 115, 56);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // green
  doc.text(`${settings.currency} ${summary.totalIncome.toFixed(2)}`, 190, 42, { align: 'right' });

  doc.setTextColor(239, 68, 68); // red
  doc.text(`${settings.currency} ${summary.totalExpenses.toFixed(2)}`, 190, 49, { align: 'right' });

  doc.setTextColor(summary.netSavings >= 0 ? 16 : 239, summary.netSavings >= 0 ? 185 : 68, summary.netSavings >= 0 ? 129 : 68);
  doc.text(`${settings.currency} ${summary.netSavings.toFixed(2)}`, 190, 56, { align: 'right' });

  let currentY = 66;

  // 1. Category Breakdown Table
  if (summary.categoryBreakdown.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('CATEGORY-WISE SPENDING BREAKDOWN', 14, currentY);

    const categoryRows = summary.categoryBreakdown.map((item) => [
      item.category.name,
      item.count.toString(),
      `${item.percentage.toFixed(1)}%`,
      `${settings.currency} ${item.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Category', 'Count', '% of Expenses', 'Total Spending']],
      body: categoryRows,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 2. Itemized Transactions Table
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`ITEMIZED TRANSACTIONS (${transactions.length} Records)`, 14, currentY);

  const txRows = transactions.map((t) => {
    const profName = profMap.get(t.profileId) || t.profileId;
    const catName = catMap.get(t.categoryId) || 'Transfer/Other';
    const accName = accMap.get(t.accountId) || t.accountId;
    const destName = t.toAccountId ? ` ➔ ${accMap.get(t.toAccountId) || t.toAccountId}` : '';
    const typeLabel = t.type.toUpperCase();

    let amtStr = '';
    if (t.type === 'income') amtStr = `+${t.amount.toFixed(2)}`;
    else if (t.type === 'expense') amtStr = `-${t.amount.toFixed(2)}`;
    else amtStr = `${t.amount.toFixed(2)}`;

    return [
      t.date,
      typeLabel,
      profName,
      catName,
      `${t.description}${t.notes ? ` (${t.notes})` : ''}`,
      `${accName}${destName}`,
      amtStr,
    ];
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Date', 'Type', 'Profile', 'Category', 'Description', 'Account', `Amount (${settings.currency})`]],
    body: txRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 16 },
      2: { cellWidth: 18 },
      3: { cellWidth: 25 },
      4: { cellWidth: 48 },
      5: { cellWidth: 28 },
      6: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [239, 68, 68];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Day-to-day Expenses • Confidential Financial Record • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const safeFilename = `DayToDay_Expenses_${profileLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}

/**
 * Generate and trigger download of a genuine multi-tab Excel Workbook (.xlsx)
 */
export function exportToExcel(context: ExportContext): void {
  const { profileLabel, periodLabel, settings, summary, transactions, categories, accounts, profiles } = context;

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));
  const profMap = new Map(profiles.map((p) => [p.id, p.name]));

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary Sheet
  const summaryData = [
    ['Day-to-day Expenses - Financial Statement'],
    ['Generated On', new Date().toLocaleString()],
    ['Profile Scope', profileLabel],
    ['Period', periodLabel],
    ['Currency', settings.currency],
    [],
    ['KEY PERFORMANCE INDICATORS'],
    ['Metric', 'Amount', 'Currency'],
    ['Total Income', summary.totalIncome, settings.currency],
    ['Total Expenses', summary.totalExpenses, settings.currency],
    ['Net Cash Flow / Savings', summary.netSavings, settings.currency],
    ['Total Transaction Count', summary.transactionCount, 'records'],
    [],
    ['CATEGORY-WISE EXPENSE BREAKDOWN'],
    ['Category', 'Transaction Count', 'Spending Amount', '% of Total Expense'],
    ...summary.categoryBreakdown.map((item) => [
      item.category.name,
      item.count,
      item.amount,
      `${item.percentage.toFixed(2)}%`,
    ]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

  // Sheet 2: All Itemized Transactions
  const txHeader = [
    'Transaction ID',
    'Date',
    'Time',
    'Type',
    'Profile',
    'Category',
    'Subcategory',
    'Description',
    'Notes',
    'Account',
    'To Account (Transfer)',
    'Amount',
    'Currency',
    'Reference No',
  ];

  const txRows = transactions.map((t) => [
    t.id,
    t.date,
    t.time || '',
    t.type.toUpperCase(),
    profMap.get(t.profileId) || t.profileId,
    catMap.get(t.categoryId) || 'N/A',
    t.subCategory || '',
    t.description,
    t.notes || '',
    accMap.get(t.accountId) || t.accountId,
    t.toAccountId ? accMap.get(t.toAccountId) || t.toAccountId : '',
    t.amount,
    t.currency,
    t.referenceNo || '',
  ]);

  const txSheet = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Transactions');

  const safeFilename = `DayToDay_Expenses_${profileLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

/**
 * Generate and trigger download of a genuine UTF-8 CSV with standard headers
 */
export function exportToCSV(context: ExportContext): void {
  const { profileLabel, settings, transactions, categories, accounts, profiles } = context;

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));
  const profMap = new Map(profiles.map((p) => [p.id, p.name]));

  const headers = [
    'Date',
    'Time',
    'Type',
    'Profile',
    'Category',
    'Subcategory',
    'Description',
    'Amount',
    'Currency',
    'Account',
    'To_Account',
    'Notes',
    'Reference_No',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = transactions.map((t) => [
    escapeCSV(t.date),
    escapeCSV(t.time || ''),
    escapeCSV(t.type),
    escapeCSV(profMap.get(t.profileId) || t.profileId),
    escapeCSV(catMap.get(t.categoryId) || ''),
    escapeCSV(t.subCategory || ''),
    escapeCSV(t.description),
    t.amount,
    escapeCSV(t.currency),
    escapeCSV(accMap.get(t.accountId) || t.accountId),
    escapeCSV(t.toAccountId ? accMap.get(t.toAccountId) || '' : ''),
    escapeCSV(t.notes || ''),
    escapeCSV(t.referenceNo || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DayToDay_Expenses_${profileLabel.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
