'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Music, Clock, Star, Trash2, Pencil, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useMeditations,
  useCreateMeditation,
  useUpdateMeditation,
  useDeleteMeditation,
  useMeditationStats,
  uploadMeditationAudio,
  uploadMeditationThumbnail,
  deleteMeditationFile,
} from '@/hooks/use-meditations';
import type { Meditation } from '@/lib/types/database.types';

const categories = ['Sleep', 'Anxiety', 'Stress', 'Mindfulness', 'Focus', 'Self-Love', 'Gratitude', 'Relax', 'Healing', 'Morning', 'Evening', 'Giấc ngủ', 'Tập trung', 'Lo âu', 'Căng thẳng'];
const levels = ['beginner', 'intermediate', 'advanced'];

export default function MeditationsPage() {
  const t = useTranslations('Meditations');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);

  const { toast } = useToast();

  const filters = {
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    level: levelFilter !== 'all' ? levelFilter : undefined,
    search: search || undefined,
  };

  const { data: meditations = [], isLoading } = useMeditations(filters);
  const { data: stats } = useMeditationStats();
  const createMutation = useCreateMeditation();
  const updateMutation = useUpdateMeditation();
  const deleteMutation = useDeleteMeditation();

  const handleCreate = async (formData: FormData) => {
    try {
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const level = formData.get('level') as string;
      const duration = parseInt(formData.get('duration') as string);
      const audioFile = formData.get('audio') as File | null;
      const thumbnailFile = formData.get('thumbnail') as File | null;

      if (!title || !audioFile) {
        toast({
          title: t('error'),
          description: t('titleAndAudioRequired'),
          variant: 'destructive',
        });
        return;
      }

      // Generate temporary ID for file upload
      const tempId = crypto.randomUUID();

      // Upload files
      const audioUrl = await uploadMeditationAudio(audioFile, tempId);
      let thumbnailUrl = null;
      if (thumbnailFile) {
        thumbnailUrl = await uploadMeditationThumbnail(thumbnailFile, tempId);
      }

      // Create meditation record
      await createMutation.mutateAsync({
        title,
        description,
        category,
        level: level as 'beginner' | 'intermediate' | 'advanced',
        duration_minutes: duration,
        audio_url: audioUrl,
        thumbnail_url: thumbnailUrl,
      });

      toast({
        title: t('success'),
        description: t('createdSuccessfully'),
      });

      setIsCreateOpen(false);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!selectedMeditation) return;

    try {
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const level = formData.get('level') as string;
      const duration = parseInt(formData.get('duration') as string);
      const audioFile = formData.get('audio') as File | null;
      const thumbnailFile = formData.get('thumbnail') as File | null;

      const updates: Partial<Meditation> = {
        title,
        description,
        category,
        level: level as 'beginner' | 'intermediate' | 'advanced',
        duration_minutes: duration,
      };

      // Upload new audio if provided
      if (audioFile) {
        const audioUrl = await uploadMeditationAudio(audioFile, selectedMeditation.id);
        updates.audio_url = audioUrl;
        // Delete old audio
        if (selectedMeditation.audio_url) {
          await deleteMeditationFile(selectedMeditation.audio_url);
        }
      }

      // Upload new thumbnail if provided
      if (thumbnailFile) {
        const thumbnailUrl = await uploadMeditationThumbnail(thumbnailFile, selectedMeditation.id);
        updates.thumbnail_url = thumbnailUrl;
        // Delete old thumbnail
        if (selectedMeditation.thumbnail_url) {
          await deleteMeditationFile(selectedMeditation.thumbnail_url);
        }
      }

      await updateMutation.mutateAsync({
        id: selectedMeditation.id,
        updates,
      });

      toast({
        title: t('success'),
        description: t('updatedSuccessfully'),
      });

      setIsEditOpen(false);
      setSelectedMeditation(null);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpdate'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const meditation = meditations.find((m) => m.id === deleteId);
      if (meditation) {
        // Delete files from storage
        if (meditation.audio_url) {
          await deleteMeditationFile(meditation.audio_url);
        }
        if (meditation.thumbnail_url) {
          await deleteMeditationFile(meditation.thumbnail_url);
        }
      }

      await deleteMutation.mutateAsync(deleteId);

      toast({
        title: t('success'),
        description: t('deletedSuccessfully'),
      });

      setDeleteId(null);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToDelete'),
        variant: 'destructive',
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addMeditation')}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('totalMeditations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          {Object.entries(stats.byCategory).slice(0, 3).map(([cat, count]) => {
            const key = `category_${cat.toLowerCase().trim().replace(/[\s-]/g, '_')}`;
            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t(key as any) || cat}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count as number}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories')}</SelectItem>
                {categories.map((cat) => {
                  const key = `category_${cat.toLowerCase().trim().replace(/[\s-]/g, '_')}`;
                  return (
                    <SelectItem key={cat} value={cat}>
                      {t(key as any) || cat}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(value) => value && setLevelFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('level')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allLevels')}</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {t(`level_${level}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Meditations Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : meditations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Music className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t('emptyMessage')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meditations.map((meditation) => (
            <Card key={meditation.id} className="overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                {meditation.thumbnail_url ? (
                  <img
                    src={meditation.thumbnail_url}
                    alt={meditation.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Music className="h-16 w-16 text-muted-foreground opacity-30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {meditation.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {meditation.description || t('noDescription')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {meditation.category && (
                      <Badge variant="outline" className="text-xs">
                        {t(`category_${meditation.category.toLowerCase().trim().replace(/[\s-]/g, '_')}` as any) || meditation.category}
                      </Badge>
                    )}
                    {meditation.level && (
                      <Badge className={getLevelColor(meditation.level)}>
                        {t(`level_${meditation.level}` as any) || meditation.level}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{meditation.duration_minutes || 0} {t('minutesShort')}</span>
                    </div>
                    {meditation.rating !== undefined && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{meditation.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedMeditation(meditation);
                        setIsEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      {t('edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (meditation.audio_url) {
                          window.open(meditation.audio_url, '_blank');
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setDeleteId(meditation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('createTitle')}</DialogTitle>
            <DialogDescription>
              {t('createDescription')}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate(new FormData(e.currentTarget));
            }}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t('fieldTitle')} *</Label>
                <Input id="title" name="title" required />
              </div>

              <div>
                <Label htmlFor="description">{t('fieldDescription')}</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select name="category" defaultValue={categories[0]}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t(`category_${cat.toLowerCase().trim().replace(/[\s-]/g, '_')}` as any) || cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">{t('level')}</Label>
                  <Select name="level" defaultValue="beginner">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {t(`level_${level}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="duration">{t('durationMinutes')}</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  defaultValue="10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="audio">{t('audioFileLabel')}</Label>
                <Input
                  id="audio"
                  name="audio"
                  type="file"
                  accept="audio/*"
                  required
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">{t('thumbnailLabel')}</Label>
                <Input
                  id="thumbnail"
                  name="thumbnail"
                  type="file"
                  accept="image/*"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('creating') : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
            <DialogDescription>{t('editDescription')}</DialogDescription>
          </DialogHeader>
          {selectedMeditation && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">{t('fieldTitle')} *</Label>
                  <Input
                    id="edit-title"
                    name="title"
                    defaultValue={selectedMeditation.title}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">{t('fieldDescription')}</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={selectedMeditation.description || ''}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-category">{t('category')}</Label>
                    <Select
                      name="category"
                      defaultValue={selectedMeditation.category || categories[0]}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {t(`category_${cat.toLowerCase().trim().replace(/[\s-]/g, '_')}` as any) || cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-level">{t('level')}</Label>
                    <Select
                      name="level"
                      defaultValue={selectedMeditation.level || 'beginner'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {t(`level_${level}` as any)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-duration">{t('durationMinutes')}</Label>
                  <Input
                    id="edit-duration"
                    name="duration"
                    type="number"
                    min="1"
                    defaultValue={selectedMeditation.duration_minutes || 10}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-audio">{t('replaceAudioOptional')}</Label>
                  <Input
                    id="edit-audio"
                    name="audio"
                    type="file"
                    accept="audio/*"
                  />
                  {selectedMeditation.audio_url && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('currentFile', { fileName: selectedMeditation.audio_url.split('/').pop() || '' })}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-thumbnail">{t('replaceThumbnailOptional')}</Label>
                  <Input
                    id="edit-thumbnail"
                    name="thumbnail"
                    type="file"
                    accept="image/*"
                  />
                  {selectedMeditation.thumbnail_url && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('currentFile', { fileName: selectedMeditation.thumbnail_url.split('/').pop() || '' })}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedMeditation(null);
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? t('updating') : t('update')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
