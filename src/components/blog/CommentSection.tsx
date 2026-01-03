import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useBlogComments, BlogComment } from '@/hooks/useBlogComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageCircle, 
  Send, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommentSectionProps {
  articleSlug: string;
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'pt-BR':
    case 'pt-PT':
      return ptBR;
    case 'es-ES':
      return es;
    default:
      return enUS;
  }
};

export const CommentSection = ({ articleSlug }: CommentSectionProps) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { 
    comments, 
    loading, 
    submitting, 
    addComment, 
    deleteComment,
    updateComment,
    isAuthenticated,
    currentUserId 
  } = useBlogComments(articleSlug);

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async () => {
    const { success } = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const handleEdit = (comment: BlogComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    const { success } = await updateComment(commentId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm(t('blog.comments.confirmDelete', 'Tem certeza que deseja excluir este comentário?'))) {
      await deleteComment(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: getLocale(language) 
      });
    } catch {
      return '';
    }
  };

  // Filter visible comments (approved and not hidden, or own comments)
  const visibleComments = comments.filter(c => 
    (c.is_approved && !c.is_hidden) || c.user_id === currentUserId
  );

  return (
    <Card className="bg-card/50 border-border/50 mt-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5 text-primary" />
          {t('blog.comments.title', 'Comentários')} 
          <span className="text-sm font-normal text-muted-foreground">
            ({visibleComments.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <Textarea
              placeholder={t('blog.comments.placeholder', 'Deixe seu comentário...')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/1000
              </span>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !newComment.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting 
                  ? t('common.sending', 'Enviando...') 
                  : t('blog.comments.send', 'Enviar')
                }
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
            <LogIn className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground flex-1">
              {t('blog.comments.loginToComment', 'Faça login para deixar um comentário')}
            </p>
            <Link to="/login">
              <Button size="sm" variant="outline">
                {t('auth.login', 'Entrar')}
              </Button>
            </Link>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))
          ) : visibleComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t('blog.comments.noComments', 'Seja o primeiro a comentar!')}</p>
            </div>
          ) : (
            visibleComments.map((comment) => (
              <div 
                key={comment.id} 
                className={cn(
                  "flex gap-3 p-3 rounded-lg transition-colors",
                  comment.is_hidden && "bg-yellow-500/10 border border-yellow-500/30"
                )}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  {comment.profile?.avatar_url ? (
                    <AvatarImage src={comment.profile.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-lg">
                    {comment.profile?.avatar_icon || '👤'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {comment.profile?.display_name || t('common.anonymous', 'Anônimo')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                    {comment.is_hidden && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="w-3 h-3" />
                        {t('blog.comments.pendingReview', 'Em análise')}
                      </span>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] resize-none text-sm"
                        maxLength={1000}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCancelEdit}
                          className="h-7 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          {t('common.cancel', 'Cancelar')}
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="h-7 px-2"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {t('common.save', 'Salvar')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>

                      {currentUserId === comment.user_id && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(comment)}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(comment.id)}
                            className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
