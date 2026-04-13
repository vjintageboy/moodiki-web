'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Calendar,
  Clock,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  Mail,
  Phone as PhoneIcon,
  MessageSquare,
  FileText,
  BarChart3
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useExpertPatients, type PatientRecord } from '@/hooks/use-patients';
import { usePatientNotes, useUpsertPatientNote } from '@/hooks/use-patient-notes';
import { usePatientSessions } from '@/hooks/use-patient-sessions';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Patients page for experts to view their clients/patients
 * Features:
 * - Real-time filtering/search
 * - Phone masking with reveal interaction
 * - Patient detail drawer with session history and notes
 */
export default function PatientsPage() {
  const t = useTranslations('PatientsPage');
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<Set<string>>(new Set());
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [noteContent, setNoteContent] = useState('');

  // 1. Get current expert ID
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // 2. Fetch patients
  const { data: patients, isLoading } = useExpertPatients(user?.id);

  // 3. Fetch patient notes when a patient is selected
  const { data: existingNotes, isLoading: isLoadingNotes } = usePatientNotes(
    user?.id,
    selectedPatient?.id
  );

  // 4. Mutation for saving notes
  const upsertNoteMutation = useUpsertPatientNote();

  // 5. Fetch patient sessions (appointment history)
  const { data: sessions, isLoading: isLoadingSessions } = usePatientSessions(
    user?.id,
    selectedPatient?.id
  );

  // Load existing note when patient is selected
  useEffect(() => {
    if (selectedPatient && existingNotes && existingNotes.length > 0) {
      setNoteContent(existingNotes[0].note);
    } else {
      setNoteContent('');
    }
  }, [selectedPatient, existingNotes]);

  // 3. Filter patients
  const filteredPatients = patients?.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleRevealPhone = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newRevealed = new Set(revealedPhoneIds);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }
    setRevealedPhoneIds(newRevealed);
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return 'N/A';
    if (phone.length < 4) return phone;
    return `${phone.slice(0, 4)} *** *** ${phone.slice(-3)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground text-lg">
            {t('description')}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('searchPlaceholder')} 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-blue-100 dark:bg-blue-900/30 p-4">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('totalPatients')}</p>
              <p className="text-3xl font-bold">{patients?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-green-100 dark:bg-green-900/30 p-4">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('totalAppointments')}</p>
              <p className="text-3xl font-bold">
                {patients?.reduce((sum, p) => sum + p.total_sessions, 0) || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-2xl bg-purple-100 dark:bg-purple-900/30 p-4">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('recentPatients')}</p>
              <p className="text-3xl font-bold">
                {patients?.length ? Math.min(patients.length, 5) : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <Card className="shadow-lg border-none">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('patientsList')}
            </CardTitle>
            <Badge variant="outline" className="font-mono">
              {filteredPatients.length} Patients
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('noPatients')}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {searchQuery ? `No results found for "${searchQuery}"` : t('noPatientsDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient)}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-4 -mx-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-primary/5">
                      <AvatarImage src={patient.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                        {patient.full_name?.slice(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-bold text-lg group-hover:text-primary transition-colors">
                        {patient.full_name || 'Anonymous User'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {patient.email}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span className="font-mono">
                            {revealedPhoneIds.has(patient.id) ? patient.phone_number : maskPhone(patient.phone_number)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={(e) => toggleRevealPhone(e, patient.id)}
                          >
                            {revealedPhoneIds.has(patient.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6 pl-16 md:pl-0">
                    <div className="text-center md:text-right hidden sm:block">
                      <p className="text-sm font-medium">{t('totalSessions')}</p>
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'} className="mt-0.5">
                        {patient.total_sessions} {patient.total_sessions === 1 ? 'Session' : 'Sessions'}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">{t('lastSession')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                        {patient.last_session ? format(new Date(patient.last_session), 'MMM dd, yyyy') : 'No history'}
                      </p>
                    </div>
                    
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Detail Drawer */}
      <Sheet open={!!selectedPatient} onOpenChange={(open: boolean) => !open && setSelectedPatient(null)}>
        <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
          {selectedPatient && (
            <div className="space-y-8 py-6">
              <SheetHeader className="text-left space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-muted">
                    <AvatarImage src={selectedPatient.avatar_url || ''} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {selectedPatient.full_name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-2xl">{selectedPatient.full_name}</SheetTitle>
                    <SheetDescription className="flex flex-col gap-1 mt-1">
                      <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {selectedPatient.email}</span>
                      <span className="flex items-center gap-2">
                        <PhoneIcon className="h-3.5 w-3.5" /> 
                        {selectedPatient.phone_number || 'No phone'}
                        <Badge variant="outline" className="ml-2 py-0 h-5">Verified</Badge>
                      </span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Patient Stats Recap */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-xl border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('totalSessions')}</p>
                  <p className="text-2xl font-bold mt-1">{selectedPatient.total_sessions}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-primary">{t('status')}</p>
                  <Badge className="mt-2" variant={selectedPatient.status === 'active' ? 'default' : 'secondary'}>
                    {selectedPatient.status === 'active' ? t('activeStatus') : t('completedStatus')}
                  </Badge>
                </div>
              </div>

              {/* Internal Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold border-b pb-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {t('internalNotes')}
                </div>
                <div className="space-y-3">
                  <textarea
                    className="w-full min-h-[120px] p-4 rounded-xl border bg-muted/20 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                    placeholder={t('internalNotesPlaceholder')}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    disabled={isLoadingNotes || upsertNoteMutation.isPending}
                  ></textarea>
                  <Button
                    className="w-full shadow-sm"
                    size="sm"
                    onClick={() => {
                      if (selectedPatient && user?.id && noteContent.trim()) {
                        upsertNoteMutation.mutate({
                          expertId: user.id,
                          patientId: selectedPatient.id,
                          note: noteContent.trim(),
                        });
                      }
                    }}
                    disabled={!noteContent.trim() || upsertNoteMutation.isPending || isLoadingNotes}
                  >
                    {upsertNoteMutation.isPending ? t('savingNotes') : t('saveNotes')}
                  </Button>
                </div>
              </div>

              {/* Session History Feed */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold border-b pb-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t('sessionHistory')}
                </div>
                <div className="space-y-3">
                  {isLoadingSessions ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : !sessions || sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">{t('noSessions')}</p>
                    </div>
                  ) : (
                    <>
                      {sessions.slice(0, 5).map((session, i) => {
                        const sessionDate = new Date(session.appointment_date);
                        const endDate = new Date(sessionDate.getTime() + session.duration_minutes * 60000);
                        
                        return (
                          <div key={session.id} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className={`h-3 w-3 rounded-full mt-1 ${
                                session.status === 'completed' ? 'bg-green-500' :
                                session.status === 'cancelled' ? 'bg-red-500' :
                                session.status === 'confirmed' ? 'bg-blue-500' :
                                'bg-gray-400'
                              }`}></div>
                              {i < Math.min(sessions.length, 5) - 1 && (
                                <div className="w-px flex-1 bg-border my-1"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-bold">
                                Session #{selectedPatient.total_sessions - i}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(sessionDate, 'MMM dd, yyyy')} • {format(sessionDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                              </p>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 capitalize">
                                  {session.call_type}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] py-0 px-2 h-5 ${
                                    session.status === 'completed' ? 'text-green-600 border-green-200 bg-green-50' :
                                    session.status === 'cancelled' ? 'text-red-600 border-red-200 bg-red-50' :
                                    session.status === 'confirmed' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                    'text-gray-600 border-gray-200 bg-gray-50'
                                  }`}
                                >
                                  {session.status}
                                </Badge>
                                {session.payment_status === 'paid' && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 text-emerald-600 border-emerald-200 bg-emerald-50">
                                    Paid
                                  </Badge>
                                )}
                              </div>
                              {session.user_notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                                  "{session.user_notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {sessions.length > 5 && (
                        <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:bg-muted font-normal h-8">
                          View older sessions ({sessions.length - 5} more)...
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() => {
                    if (selectedPatient) {
                      router.push(`/patients/${selectedPatient.id}/analysis`);
                    }
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('viewAnalysis')}
                </Button>
                <Button variant="outline" className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                  <MessageSquare className="h-4 w-4" />
                  {t('chat')}
                </Button>
                <Button className="flex-1 bg-primary">
                  {t('bookSession')}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
