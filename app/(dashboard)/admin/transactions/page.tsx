'use client'

import * as React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { format, subDays } from 'date-fns'
import { 
  Receipt, 
  Search, 
  Calendar, 
  Download, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign
} from 'lucide-react'
import { useAppointments } from '@/hooks/use-appointments'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent, 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExportTransactionsDialog } from '@/components/dashboard/export-transactions-dialog'
import { formatCurrency } from '@/lib/utils/currency'


function getInitials(name: string | null | undefined, fallback = 'U'): string {
  if (!name) return fallback;
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function TransactionsPage() {
  const t = useTranslations('TransactionsPage')
  const locale = useLocale()
  
  // State for filters
  const [searchQuery, setSearchQuery] = React.useState('')
  const [startDate, setStartDate] = React.useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = React.useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [isExportOpen, setIsExportOpen] = React.useState(false)

  // Fetch paid appointments (transactions)
  // We use the same useAppointments hook but filtered for 'paid'
  const { appointments, isLoading, error, refetch, isFetching } = useAppointments({
    paymentStatus: 'paid',
    dateFrom: startDate ? new Date(startDate).toISOString() : undefined,
    dateTo: endDate ? new Date(endDate).toISOString() : undefined,
    pageSize: 1000, // Fetch all for local filtering/sorting in DataTable
  })

  // Columns definition for DataTable
  const columns: Column<any>[] = [
    {
      key: 'payment_trans_id',
      header: t('table.id'),
      sortable: true,
      render: (tx) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-foreground">
            {tx.payment_trans_id || tx.payment_id || 'N/A'}
          </span>
          <span className="text-[10px] text-muted-foreground opacity-50">
            Internal ID: {tx.id.substring(0, 8)}
          </span>
        </div>
      )
    },
    {
      key: 'appointment_date',
      header: t('table.date'),
      sortable: true,
      render: (tx) => (
        <div className="flex flex-col">
          <span className="font-medium whitespace-nowrap">
            {format(new Date(tx.appointment_date), locale === 'vi' ? 'dd/MM/yyyy' : 'MM/dd/yyyy')}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(tx.appointment_date), 'HH:mm')}
          </span>
        </div>
      )
    },
    {
      key: 'user',
      header: t('table.customer'),
      render: (tx) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-blue-100">
            <AvatarImage src={tx.user?.avatar_url} />
            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
              {getInitials(tx.user?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate text-sm">
              {tx.user?.full_name || 'Anonymous'}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {tx.user?.email}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'expert',
      header: t('table.expert'),
      render: (tx) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-purple-100">
            <AvatarImage src={tx.expertUser?.avatar_url} />
            <AvatarFallback className="bg-purple-50 text-purple-600 text-xs font-bold">
              {getInitials(tx.expertUser?.full_name, 'E')}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate text-sm">
              {tx.expertUser?.full_name || 'N/A'}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {tx.expert?.specialization || 'Professional'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'expert_base_price',
      header: t('table.amount'),
      sortable: true,
      className: 'text-right',
      render: (tx) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(tx.expert_base_price || 0, locale)}
        </span>
      )
    },
    {
      key: 'payment_status',
      header: t('table.status'),
      className: 'text-center',
      render: (tx) => (
        <Badge variant="outline" className={cn(
          "gap-1 font-medium",
          tx.payment_status === 'paid' 
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
            : "bg-red-500/10 text-red-600 border-red-500/20"
        )}>
          <CheckCircle2 className="h-3 w-3" />
          {tx.payment_status === 'paid' ? t('status.paid') : tx.payment_status}
        </Badge>
      )
    }
  ]

  // Filter local results by search query
  const filteredTransactions = React.useMemo(() => {
    if (!searchQuery) return appointments

    const query = searchQuery.toLowerCase()
    return appointments.filter(tx => 
      tx.payment_trans_id?.toLowerCase().includes(query) ||
      tx.payment_id?.toLowerCase().includes(query) ||
      tx.user?.full_name?.toLowerCase().includes(query) ||
      tx.user?.email?.toLowerCase().includes(query) ||
      tx.expertUser?.full_name?.toLowerCase().includes(query)
    )
  }, [appointments, searchQuery])

  const totalAmount = filteredTransactions.reduce((acc, curr) => acc + (curr.expert_base_price || 0), 0)

  return (
    <div className="space-y-6 max-w-full">
      {/* Header section with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl px-1">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Card className="min-w-[200px] border-emerald-500/20 shadow-sm bg-gradient-to-br from-emerald-500/[0.05] to-emerald-600/[0.05]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">{t('export.totalAmount')}</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(totalAmount, locale)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="min-w-[160px] border-primary/20 shadow-sm bg-gradient-to-br from-primary/[0.05] to-primary/[0.08]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">{t('title')}</p>
                <p className="text-xl font-black text-primary">
                  {filteredTransactions.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background border-muted-foreground/20 focus-visible:ring-primary shadow-sm"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 bg-background border border-muted-foreground/20 rounded-md px-3 h-11 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium w-[120px]"
              />
              <span className="text-muted-foreground px-1">—</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium w-[120px]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => refetch()} 
                disabled={isLoading || isFetching}
                className="h-11 px-4 gap-2 border-muted-foreground/20"
              >
                {isLoading || isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {locale === 'vi' ? 'Làm mới' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                className="h-11 px-4 gap-2 border-muted-foreground/20 hidden sm:flex"
                onClick={() => setIsExportOpen(true)}
              >
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table using DataTable for optimized layout */}
      <DataTable 
        data={filteredTransactions}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={t('noTransactions')}
        initialPageSize={20}
        className="border rounded-xl shadow-sm overflow-hidden bg-background"
      />
      
      <div className="flex items-center justify-between text-[11px] text-muted-foreground/60 px-4 py-2 bg-muted/30 rounded-lg">
        <p>SECURE TRANSACTION MONITORING SYSTEM • {new Date().getFullYear()}</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Encrypted</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
        </div>
      </div>

      <ExportTransactionsDialog 
        isOpen={isExportOpen} 
        onOpenChange={setIsExportOpen} 
        data={filteredTransactions} 
      />
    </div>
  )
}
