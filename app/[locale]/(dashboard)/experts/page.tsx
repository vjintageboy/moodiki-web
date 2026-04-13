'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApprovedExperts, usePendingExperts, useRejectedExperts } from '@/hooks/use-recent-activities';
import { ApprovedExpertsTable } from '@/components/experts/approved-experts-table';
import { PendingExpertsTab } from '@/components/experts/pending-experts-tab';
import { RejectedExpertsTab } from '@/components/experts/rejected-experts-tab';
import { useTranslations } from 'next-intl';

export default function ExpertsPage() {
  const t = useTranslations('ExpertsPage');
  const { data: approvedExperts, isLoading: approvedLoading } = useApprovedExperts();
  const { data: pendingExperts, isLoading: pendingLoading } = usePendingExperts();
  const { data: rejectedExperts, isLoading: rejectedLoading } = useRejectedExperts();

  const approvedCount = approvedExperts?.length || 0;
  const pendingCount = pendingExperts?.length || 0;
  const rejectedCount = rejectedExperts?.length || 0;
  const isLoading = approvedLoading || pendingLoading || rejectedLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            {t('allExperts', { count: approvedCount })}
          </TabsTrigger>
          <TabsTrigger value="pending">
            {t('pending', { count: pendingCount })}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            {t('rejected', { count: rejectedCount })}
          </TabsTrigger>
        </TabsList>

        {/* All Experts Tab */}
        <TabsContent value="all" className="mt-6">
          <ApprovedExpertsTable
            experts={approvedExperts}
            isLoading={approvedLoading}
          />
        </TabsContent>

        {/* Pending Applications Tab */}
        <TabsContent value="pending" className="mt-6">
          <div>
            <PendingExpertsTab />
          </div>
        </TabsContent>

        {/* Rejected/Suspended Tab */}
        <TabsContent value="rejected" className="mt-6">
          <RejectedExpertsTab
            experts={rejectedExperts}
            isLoading={rejectedLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

