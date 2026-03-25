'use client';

import { useState } from 'react';
import { Search, Filter, MessageSquare, Heart, Eye, EyeOff, Trash2, User, Calendar } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  usePosts,
  useDeletePost,
  useTogglePostVisibility,
  usePostStats,
  usePostComments,
  useDeleteComment,
} from '@/hooks/use-posts';
import { format } from 'date-fns';

const categories = ['community', 'tips', 'success-story', 'question', 'discussion'];

export default function PostsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewPostId, setViewPostId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { toast } = useToast();

  const filters = {
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: search || undefined,
  };

  const { data: posts = [], isLoading } = usePosts(filters);
  const { data: stats } = usePostStats();
  const { data: comments = [] } = usePostComments(viewPostId);
  const deleteMutation = useDeletePost();
  const deleteCommentMutation = useDeleteComment();
  const toggleVisibility = useTogglePostVisibility();

  const selectedPost = posts.find((p) => p.id === viewPostId);

  // Apply visibility filter client-side (avoids extra DB query)
  const filteredPosts = posts.filter((p) => {
    if (visibilityFilter === 'visible') return !p.is_hidden;
    if (visibilityFilter === 'hidden') return p.is_hidden;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      setDeleteId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      await deleteCommentMutation.mutateAsync(deleteCommentId);
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
      setDeleteCommentId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleToggleVisibility = async (id: string, currentlyHidden: boolean) => {
    setTogglingId(id);
    try {
      await toggleVisibility.mutateAsync({ id, is_hidden: !currentlyHidden });
      toast({
        title: currentlyHidden ? 'Post Unhidden' : 'Post Hidden',
        description: currentlyHidden
          ? 'The post is now visible to users.'
          : 'The post is now hidden from users.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post visibility',
        variant: 'destructive',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'community':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'tips':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'success-story':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'question':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Community Posts</h2>
        <p className="text-muted-foreground">
          Manage and moderate community posts and discussions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0
                  ? ((stats.totalLikes + stats.totalComments) / stats.total).toFixed(1)
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={visibilityFilter}
              onValueChange={(value) => setVisibilityFilter(value as typeof visibilityFilter)}
            >
              <SelectTrigger className="w-full md:w-[160px]">
                <Eye className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>
              {visibilityFilter === 'hidden'
                ? 'No hidden posts.'
                : visibilityFilter === 'visible'
                ? 'No visible posts found.'
                : 'No posts found. Users can create posts in the mobile app.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.author?.avatar_url || undefined} />
                          <AvatarFallback>
                            {post.is_anonymous
                              ? 'AN'
                              : post.author?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {post.is_anonymous
                              ? 'Anonymous User'
                              : post.author?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), 'MMM d, yyyy • HH:mm')}
                          </p>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-3">
                        {post.content}
                      </p>

                      {post.image_url && (
                        <div className="mt-3 rounded-lg overflow-hidden">
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="max-h-64 w-auto object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {post.category && (
                      <Badge className={getCategoryColor(post.category)}>
                        {post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Badge>
                    )}
                    {post.is_hidden && (
                      <Badge variant="outline" className="border-orange-400 text-orange-500 bg-orange-50 dark:bg-orange-950/30">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Hidden
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comment_count || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewPostId(post.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={post.is_hidden
                        ? 'text-green-600 hover:text-green-700 border-green-300'
                        : 'text-orange-500 hover:text-orange-600 border-orange-300'
                      }
                      onClick={() => handleToggleVisibility(post.id, !!post.is_hidden)}
                      disabled={togglingId === post.id}
                    >
                      {togglingId === post.id ? (
                        <span className="h-4 w-4 mr-2 inline-block rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : post.is_hidden ? (
                        <Eye className="h-4 w-4 mr-2" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-2" />
                      )}
                      {togglingId === post.id ? '...' : post.is_hidden ? 'Unhide' : 'Hide'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 ml-auto"
                      onClick={() => setDeleteId(post.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Post Dialog */}
      <Dialog open={!!viewPostId} onOpenChange={() => setViewPostId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-6">
              {/* Post Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedPost.author?.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedPost.is_anonymous
                        ? 'AN'
                        : selectedPost.author?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedPost.is_anonymous
                        ? 'Anonymous User'
                        : selectedPost.author?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPost.author?.email && !selectedPost.is_anonymous
                        ? selectedPost.author.email
                        : 'Hidden'}
                    </p>
                  </div>
                </div>

                <h3 className="text-2xl font-bold">{selectedPost.title}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {selectedPost.content}
                </p>

                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt="Post"
                    className="rounded-lg max-h-96 w-auto"
                  />
                )}

                <div className="flex items-center gap-4 text-sm">
                  <Badge className={getCategoryColor(selectedPost.category || 'community')}>
                    {(selectedPost.category || 'community').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{selectedPost.likes_count || 0} likes</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{selectedPost.comment_count || 0} comments</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">
                  Comments ({comments.length})
                </h4>
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user?.avatar_url} />
                          <AvatarFallback>
                            {comment.is_anonymous ? 'AN' : comment.user?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">
                              {comment.is_anonymous
                                ? 'Anonymous'
                                : comment.user?.full_name || 'Unknown'}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-red-500"
                              onClick={() => setDeleteCommentId(comment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {comment.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(comment.created_at), 'MMM d, yyyy • HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
              All comments and likes will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
