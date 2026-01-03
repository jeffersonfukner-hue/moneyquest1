import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface BlogComment {
  id: string;
  article_slug: string;
  user_id: string;
  content: string;
  is_approved: boolean;
  is_hidden: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_icon: string;
    avatar_url: string | null;
  };
  replies?: BlogComment[];
  likes_count: number;
  is_liked_by_user: boolean;
}

export const useBlogComments = (articleSlug: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch comments with profile info
      const { data: commentsData, error: commentsError } = await supabase
        .from('blog_comments')
        .select(`
          *,
          profile:profiles!blog_comments_user_id_fkey(display_name, avatar_icon, avatar_url)
        `)
        .eq('article_slug', articleSlug)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch likes counts
      const { data: likesData, error: likesError } = await supabase
        .from('blog_comment_likes')
        .select('comment_id');

      if (likesError) throw likesError;

      // Count likes per comment
      const likesCount: Record<string, number> = {};
      (likesData || []).forEach(like => {
        likesCount[like.comment_id] = (likesCount[like.comment_id] || 0) + 1;
      });

      // Fetch user's likes if authenticated
      let userLikes: Set<string> = new Set();
      if (user) {
        const { data: userLikesData } = await supabase
          .from('blog_comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        
        userLikes = new Set((userLikesData || []).map(l => l.comment_id));
      }

      // Transform the data to match our interface
      const transformedComments = (commentsData || []).map(comment => ({
        ...comment,
        profile: comment.profile as BlogComment['profile'],
        likes_count: likesCount[comment.id] || 0,
        is_liked_by_user: userLikes.has(comment.id)
      }));

      // Organize into tree structure
      const commentMap = new Map<string, BlogComment>();
      const rootComments: BlogComment[] = [];

      // First pass: create map of all comments
      transformedComments.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into tree
      transformedComments.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id)!;
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      // Sort root comments by date descending, replies ascending
      rootComments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [articleSlug, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) {
      toast.error(t('blog.comments.loginRequired', 'Faça login para comentar'));
      return { success: false };
    }

    if (!content.trim()) {
      toast.error(t('blog.comments.emptyContent', 'O comentário não pode estar vazio'));
      return { success: false };
    }

    if (content.length > 1000) {
      toast.error(t('blog.comments.tooLong', 'O comentário é muito longo (máximo 1000 caracteres)'));
      return { success: false };
    }

    try {
      setSubmitting(true);

      const insertData: {
        article_slug: string;
        user_id: string;
        content: string;
        parent_id?: string;
      } = {
        article_slug: articleSlug,
        user_id: user.id,
        content: content.trim()
      };

      if (parentId) {
        insertData.parent_id = parentId;
      }

      const { data, error } = await supabase
        .from('blog_comments')
        .insert(insertData)
        .select(`
          *,
          profile:profiles!blog_comments_user_id_fkey(display_name, avatar_icon, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Check if comment was filtered
      if (data.is_hidden) {
        toast.warning(t('blog.comments.underReview', 'Seu comentário está em análise'));
      } else {
        toast.success(
          parentId 
            ? t('blog.comments.replyAdded', 'Resposta adicionada!') 
            : t('blog.comments.added', 'Comentário adicionado!')
        );
      }

      // Refetch to get proper tree structure
      await fetchComments();

      return { success: true };
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(t('blog.comments.error', 'Erro ao adicionar comentário'));
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast.success(t('blog.comments.deleted', 'Comentário excluído'));
      await fetchComments();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(t('blog.comments.deleteError', 'Erro ao excluir comentário'));
      return { success: false };
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    if (!content.trim()) {
      toast.error(t('blog.comments.emptyContent', 'O comentário não pode estar vazio'));
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .update({ content: content.trim() })
        .eq('id', commentId)
        .select(`
          *,
          profile:profiles!blog_comments_user_id_fkey(display_name, avatar_icon, avatar_url)
        `)
        .single();

      if (error) throw error;

      if (data.is_hidden) {
        toast.warning(t('blog.comments.underReview', 'Seu comentário está em análise'));
      } else {
        toast.success(t('blog.comments.updated', 'Comentário atualizado'));
      }

      await fetchComments();

      return { success: true };
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(t('blog.comments.updateError', 'Erro ao atualizar comentário'));
      return { success: false };
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) {
      toast.error(t('blog.comments.loginRequired', 'Faça login para curtir'));
      return { success: false };
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('blog_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('blog_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('blog_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        if (error) throw error;
      }

      // Update local state immediately for better UX
      const updateLikesRecursive = (commentsList: BlogComment[]): BlogComment[] => {
        return commentsList.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes_count: existingLike ? comment.likes_count - 1 : comment.likes_count + 1,
              is_liked_by_user: !existingLike
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: updateLikesRecursive(comment.replies)
            };
          }
          return comment;
        });
      };

      setComments(prev => updateLikesRecursive(prev));

      return { success: true };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false };
    }
  };

  // Count total comments including replies
  const countAllComments = (commentsList: BlogComment[]): number => {
    return commentsList.reduce((count, comment) => {
      return count + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  return {
    comments,
    loading,
    submitting,
    addComment,
    deleteComment,
    updateComment,
    toggleLike,
    refetch: fetchComments,
    isAuthenticated: !!user,
    currentUserId: user?.id,
    totalCount: countAllComments(comments)
  };
};
