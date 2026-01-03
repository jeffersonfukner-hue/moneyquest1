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
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_icon: string;
    avatar_url: string | null;
  };
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
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          profile:profiles!blog_comments_user_id_fkey(display_name, avatar_icon, avatar_url)
        `)
        .eq('article_slug', articleSlug)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedComments = (data || []).map(comment => ({
        ...comment,
        profile: comment.profile as BlogComment['profile']
      }));

      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [articleSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
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

      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          article_slug: articleSlug,
          user_id: user.id,
          content: content.trim()
        })
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
        toast.success(t('blog.comments.added', 'Comentário adicionado!'));
      }

      // Add to list
      const newComment = {
        ...data,
        profile: data.profile as BlogComment['profile']
      };
      setComments(prev => [newComment, ...prev]);

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

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success(t('blog.comments.deleted', 'Comentário excluído'));
      
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

      const updatedComment = {
        ...data,
        profile: data.profile as BlogComment['profile']
      };

      setComments(prev => 
        prev.map(c => c.id === commentId ? updatedComment : c)
      );

      if (data.is_hidden) {
        toast.warning(t('blog.comments.underReview', 'Seu comentário está em análise'));
      } else {
        toast.success(t('blog.comments.updated', 'Comentário atualizado'));
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(t('blog.comments.updateError', 'Erro ao atualizar comentário'));
      return { success: false };
    }
  };

  return {
    comments,
    loading,
    submitting,
    addComment,
    deleteComment,
    updateComment,
    refetch: fetchComments,
    isAuthenticated: !!user,
    currentUserId: user?.id
  };
};
