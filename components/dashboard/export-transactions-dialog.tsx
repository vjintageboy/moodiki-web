'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { Download, FileDown, X, Search, Receipt, Info, Loader2, Check, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AppointmentWithRelations } from '@/hooks/use-appointments';
import { formatCurrency } from '@/lib/utils/currency';

interface ExportTransactionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: AppointmentWithRelations[];
  overrideTitle?: string;
  overrideDescription?: string;
}

type ExportFormat = 'csv' | 'xlsx';

interface ExportColumn {
  id: string;
  label: string;
  accessor: (tx: AppointmentWithRelations) => string | number;
}

export function ExportTransactionsDialog({
  isOpen,
  onOpenChange,
  data,
  overrideTitle,
  overrideDescription,
}: ExportTransactionsDialogProps) {
  const t = useTranslations('TransactionsPage');
  const locale = useLocale();

  // State for export options
  const [formatType, setFormatType] = React.useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  
  // Available columns
  const allColumns: ExportColumn[] = React.useMemo(() => [
    { id: 'id', label: 'ID', accessor: (tx) => tx.id },
    { id: 'trans_id', label: t('table.id'), accessor: (tx) => tx.payment_trans_id || tx.payment_id || 'N/A' },
    { id: 'date', label: t('table.date'), accessor: (tx) => format(new Date(tx.appointment_date), 'yyyy-MM-dd HH:mm') },
    { id: 'customer_name', label: t('table.customer'), accessor: (tx) => tx.user?.full_name || 'Anonymous' },
    { id: 'customer_email', label: 'Email', accessor: (tx) => tx.user?.email || '' },
    { id: 'expert_name', label: t('table.expert'), accessor: (tx) => tx.expertUser?.full_name || 'N/A' },
    { id: 'amount', label: t('table.amount'), accessor: (tx) => {
      const amount = tx.expert_base_price || 0;
      return locale === 'vi' ? amount : amount / 100;
    }},
    { id: 'status', label: t('table.status'), accessor: (tx) => tx.payment_status || '' },
  ], [t]);

  const [selectedColumns, setSelectedColumns] = React.useState<Set<string>>(
    new Set(allColumns.map(col => col.id))
  );

  // Sync selected columns when allColumns changes
  React.useEffect(() => {
    setSelectedColumns(new Set(allColumns.map(col => col.id)));
  }, [allColumns]);

  const toggleColumn = (columnId: string) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnId)) {
      newSelected.delete(columnId);
    } else {
      newSelected.add(columnId);
    }
    setSelectedColumns(newSelected);
  };

  const handleExport = async () => {
    if (data.length === 0 || selectedColumns.size === 0) return;

    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const activeColumns = allColumns.filter(col => selectedColumns.has(col.id));
      const headers = activeColumns.map(col => col.label);
      const rows = data.map(tx => activeColumns.map(col => col.accessor(tx)));

      const filename = `moodiki_transactions_${format(new Date(), 'yyyyMMdd_HHmm')}`;

      if (formatType === 'csv') {
        // Escape cell: wrap in quotes, escape internal double-quotes
        const escapeCell = (val: unknown) => {
          const str = String(val ?? '');
          return `"${str.replace(/"/g, '""')}"`;
        };

        const csvRows = [
          headers.map(escapeCell).join(','),
          ...rows.map(row => row.map(escapeCell).join(','))
        ].join('\r\n');

        // Add UTF-8 BOM so Excel opens it correctly
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvRows], { type: 'text/csv;charset=utf-8;' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 300);
      } else {
        // Lazy load xlsx only when needed
        const XLSX = await import('xlsx');
        const worksheetData = [headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const totalAmount = React.useMemo(() => 
    data.reduce((acc, curr) => acc + (curr.expert_base_price || 0), 0)
  , [data]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) setIsMaximized(false);
    }}>
      <DialogContent 
        showCloseButton={false}
        className={cn(
          "p-0 overflow-hidden border-none shadow-2xl transition-all duration-300 ease-in-out z-[9999] bg-background",
          isMaximized 
            ? "!fixed !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !m-0 !rounded-none !transform-none" 
            : "!max-w-5xl !w-[95vw] !rounded-3xl"
        )}
      >
        {/* Header with Gradient */}
        <div className={cn(
          "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white relative flex items-center justify-between flex-shrink-0 z-10 shadow-lg",
          isMaximized ? "p-10" : "p-6 md:p-8"
        )}>
          <div className="flex items-center gap-6 min-w-0">
            <div className="bg-white/20 w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-inner rotate-3 ring-1 ring-white/30 hidden sm:flex flex-shrink-0">
              <FileDown className="h-8 w-8 md:h-10 md:w-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className={cn(
                  "font-black mb-1.5 tracking-tight uppercase leading-none truncate",
                  isMaximized ? "text-4xl" : "text-2xl md:text-3xl"
              )}>
                {overrideTitle || t('export.title')}
              </DialogTitle>
              <DialogDescription className="text-emerald-50/80 max-w-xl leading-relaxed font-medium text-sm md:text-base line-clamp-1">
                {overrideDescription || t('export.description')}
              </DialogDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-10 w-10 p-0 rounded-full hover:bg-white/10 text-white transition-all shadow-inner border border-white/10"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-10 w-10 p-0 rounded-full hover:bg-white/10 text-white transition-all hover:rotate-90 shadow-inner border border-white/10"
              title="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className={cn(
          "flex flex-col lg:flex-row bg-background overflow-hidden relative",
          isMaximized ? "h-[calc(100vh-160px)]" : "h-[75vh] max-h-[900px]"
        )}>
          {/* Left Side: Options & Preview */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-background border-r border-muted/30 scrollbar-thin flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 flex-shrink-0">
              {/* Format Selection */}
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t('export.format')}
                </Label>
                <Select value={formatType} onValueChange={(val: ExportFormat | null) => val && setFormatType(val)}>
                  <SelectTrigger className="h-14 rounded-2xl border-muted-foreground/10 bg-muted/5 focus:ring-emerald-500/20 px-6 font-bold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-muted-foreground/10 shadow-xl overflow-hidden z-[10001]">
                    <SelectItem value="csv" className="py-3 font-medium cursor-pointer">CSV (Comma Separated Values)</SelectItem>
                    <SelectItem value="xlsx" className="py-3 font-medium cursor-pointer">Excel Workbook (.xlsx)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Column Selection Summary */}
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {t('export.selectColumns')}
                </Label>
                <div className="flex flex-wrap gap-2 pt-1 uppercase">
                  {allColumns.filter(c => selectedColumns.has(c.id)).map(col => (
                    <Badge key={col.id} variant="secondary" className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border-blue-100/50 font-bold text-[10px]">
                      {col.label}
                    </Badge>
                  ))}
                  {selectedColumns.size === 0 && <span className="text-xs text-red-500 font-bold tracking-tight">Vui lòng chọn ít nhất 1 cột</span>}
                </div>
              </div>
            </div>

            {/* Table Preview */}
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
               <div className="flex items-center justify-between flex-shrink-0">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {t('export.preview')}
                </Label>
                <Badge className="bg-emerald-500/10 text-emerald-700 border-none font-black text-[10px] px-3">
                  {data.length} RECORDS
                </Badge>
               </div>
               
               <div className="border border-muted rounded-2xl overflow-hidden bg-background shadow-inner flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 w-full relative">
                  <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-muted/50 border-b">
                        {allColumns.filter(c => selectedColumns.has(c.id)).map(col => (
                          <TableHead key={col.id} className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70 px-4 h-12">
                            {col.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.slice(0, 50).map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-emerald-50/20 transition-colors border-muted/40">
                          {allColumns.filter(c => selectedColumns.has(c.id)).map(col => (
                            <TableCell key={col.id} className="text-xs py-4 px-4 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                              {col.id === 'amount' 
                                ? formatCurrency(tx.expert_base_price || 0, locale)
                                : String(col.accessor(tx))}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Right Side: Column Choice (Sidebar) */}
          <div className="w-full lg:w-[320px] bg-muted/20 p-6 md:p-8 flex flex-col border-t lg:border-t-0 overflow-y-auto border-l border-muted/30">
             <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-muted/50 flex-shrink-0">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t('export.selectColumns')}</h4>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 no-underline"
                    onClick={() => {
                      if (selectedColumns.size === allColumns.length) {
                        setSelectedColumns(new Set());
                      } else {
                        setSelectedColumns(new Set(allColumns.map(c => c.id)));
                      }
                    }}
                  >
                    {selectedColumns.size === allColumns.length ? 'Bỏ chọn hết' : 'Chọn hết'}
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="space-y-1.5 pb-4">
                    {allColumns.map(col => (
                      <div 
                        key={col.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group hover:bg-white dark:hover:bg-muted/50",
                          selectedColumns.has(col.id) ? "bg-white dark:bg-muted shadow-sm border border-muted" : "border border-transparent"
                        )}
                        onClick={() => toggleColumn(col.id)}
                      >
                        <Checkbox 
                          id={`col-${col.id}`} 
                          checked={selectedColumns.has(col.id)}
                          onCheckedChange={() => toggleColumn(col.id)}
                          className="data-checked:bg-emerald-600 data-checked:border-emerald-600"
                        />
                        <Label htmlFor={`col-${col.id}`} className="flex-1 cursor-pointer font-bold text-sm text-foreground/80 group-hover:text-foreground">
                          {col.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
             </div>

             {/* Footer Button Block */}
             <div className="pt-8 space-y-4 mt-auto flex-shrink-0 border-t border-muted/30">
                {/* Total Summary */}
                <div className="p-5 bg-background rounded-2xl shadow-sm border border-muted space-y-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-175 group-hover:rotate-6">
                    <Receipt className="h-16 w-16" />
                  </div>
                  <div className="flex items-center justify-between opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-wider">{t('export.totalAmount')}</span>
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-2xl font-black text-emerald-600 tracking-tight leading-none pt-1 tabular-nums relative z-10">
                    {formatCurrency(totalAmount, locale)}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleExport} 
                    disabled={isExporting || data.length === 0 || selectedColumns.size === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-16 rounded-2xl shadow-2xl shadow-emerald-500/20 gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 overflow-hidden relative"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t('export.exporting')}
                      </>
                    ) : (
                      <>
                        <Download className="h-6 w-6" />
                        <div className="flex flex-col items-start gap-0.5 text-left">
                          <span className="leading-none uppercase tracking-wide font-black">{t('export.download')}</span>
                          <span className="text-[10px] font-bold opacity-70 lowercase tracking-normal">.{formatType} / {data.length} records</span>
                        </div>
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => onOpenChange(false)}
                    className="font-bold text-muted-foreground hover:text-foreground h-12 rounded-xl"
                  >
                    {t('export.cancel')}
                  </Button>
                </div>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
