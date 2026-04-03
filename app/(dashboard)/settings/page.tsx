'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  User as UserIcon, Lock, Palette, Save, Eye, EyeOff,
  Loader2, Shield, Moon, Sun, Monitor,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const t = useTranslations('Settings.profile');
  const commonT = useTranslations('Sidebar'); // For role translations if needed
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(t('success'));
    } catch (err) {
      toast.error(t('error'), {
        description: err instanceof Error ? err.message : t('tryAgain'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar / Info banner */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold select-none">
              {(user?.full_name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.full_name || 'Admin User'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                <Shield className="w-3 h-3" />
                {user?.role ? commonT(user.role as any).toUpperCase() : 'USER'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('fullNamePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              {t('emailNotice')}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{t('role')}</Label>
            <Input 
              value={user?.role ? commonT(user.role as any) : '—'} 
              disabled 
              className="bg-muted cursor-not-allowed capitalize" 
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? t('saving') : t('saveChanges')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const t = useTranslations('Settings.security');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error(t('passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setIsChanging(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(t('error'), {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsChanging(false);
    }
  };

  const PasswordInput = ({
    id, label, value, onChange, show, setShow, placeholder,
  }: {
    id: string; label: string; value: string; onChange: (v: string) => void;
    show: boolean; setShow: (v: boolean) => void; placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PasswordInput
          id="currentPassword" label={t('currentPassword')}
          value={currentPassword} onChange={setCurrentPassword}
          show={showCurrent} setShow={setShowCurrent}
        />
        <PasswordInput
          id="newPassword" label={t('newPassword')}
          value={newPassword} onChange={setNewPassword}
          show={showNew} setShow={setShowNew}
          placeholder={t('newPasswordPlaceholder')}
        />
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t('confirmPasswordPlaceholder')}
            className={cn(confirmPassword && newPassword !== confirmPassword && 'border-red-500')}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500">{t('passwordsDoNotMatch')}</p>
          )}
        </div>

        {/* Password strength indicator */}
        {newPassword && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    newPassword.length >= level * 3
                      ? level <= 1 ? 'bg-red-400'
                      : level <= 2 ? 'bg-amber-400'
                      : level <= 3 ? 'bg-blue-400'
                      : 'bg-emerald-500'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {newPassword.length < 6 ? t('strength.weak') : newPassword.length < 9 ? t('strength.fair') : newPassword.length < 12 ? t('strength.good') : t('strength.strong')}
            </p>
          </div>
        )}

        <Button
          onClick={handleChangePassword}
          disabled={isChanging || !newPassword || !confirmPassword}
          className="gap-2"
        >
          {isChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {isChanging ? t('changing') : t('changePassword')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Preferences Tab ──────────────────────────────────────────────────────────
function PreferencesTab() {
  const t = useTranslations('Settings.preferences');
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: t('themes.light'), icon: Sun, description: t('themes.lightDesc') },
    { value: 'dark', label: t('themes.dark'), icon: Moon, description: t('themes.darkDesc') },
    { value: 'system', label: t('themes.system'), icon: Monitor, description: t('themes.systemDesc') },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map(({ value, label, icon: Icon, description }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center',
                  theme === value
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-border hover:border-purple-300 dark:hover:border-purple-700 hover:bg-muted/50'
                )}
              >
                {theme === value && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600" />
                )}
                <div className={cn(
                  'p-3 rounded-lg',
                  theme === value ? 'bg-purple-100 dark:bg-purple-800/50' : 'bg-muted'
                )}>
                  <Icon className={cn('w-5 h-5', theme === value ? 'text-purple-600' : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className={cn('font-semibold text-sm', theme === value && 'text-purple-700 dark:text-purple-300')}>
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {t('localSaveNotice')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const t = useTranslations('Settings');
  
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('description')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon className="w-4 h-4" />
            {t('tabs.profile')}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            {t('tabs.security')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="w-4 h-4" />
            {t('tabs.preferences')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
