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
  AlertCircle,
  Reply,
  CornerDownRight
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
    currentUserId,
    totalCount
  } = useBlogComments(articleSlug);

  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = async () => {
    const { success } = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const handleReply = async (parentId: string) => {
    const { success } = await addComment(replyContent, parentId);
    if (success) {
      setReplyingTo(null);
      setReplyContent('');
    }
  };

  const handleEdit = (comment: BlogComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
    setReplyingTo(null);
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

  const handleStartReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
    setEditingId(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
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
  const filterVisible = (commentsList: BlogComment[]): BlogComment[] => {
    return commentsList
      .filter(c => (c.is_approved && !c.is_hidden) || c.user_id === currentUserId)
      .map(c => ({
        ...c,
        replies: c.replies ? filterVisible(c.replies) : []
      }));
  };

  const visibleComments = filterVisible(comments);

  // Recursive comment renderer
  const CommentItem = ({ comment, depth = 0 }: { comment: BlogComment; depth?: number }) => {
    const isReply = depth > 0;
    const maxDepth = 3; // Limit nesting depth for UI clarity
    const canReply = depth < maxDepth && isAuthenticated;

    return (
      <div className={cn("space-y-3", isReply && "ml-6 sm:ml-10")}>
        <div 
          className={cn(
            "flex gap-3 p-3 rounded-lg transition-colors",
            comment.is_hidden && "bg-yellow-500/10 border border-yellow-500/30",
            isReply && "bg-muted/30"
          )}
        >
          {isReply && (
            <CornerDownRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />
          )}
          
          <Avatar className={cn("shrink-0", isReply ? "w-8 h-8" : "w-10 h-10")}>
            {comment.profile?.avatar_url ? (
              <AvatarImage src={comment.profile.avatar_url} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-lg">
              {comment.profile?.avatar_icon || '👤'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("font-medium", isReply ? "text-xs" : "text-sm")}>
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
                <p className={cn("mt-1 whitespace-pre-wrap break-words", isReply ? "text-xs" : "text-sm")}>
                  {comment.content}
                </p>

                <div className="flex gap-1 mt-2">
                  {canReply && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartReply(comment.id)}
                      className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      <span className="text-xs">{t('blog.comments.reply', 'Responder')}</span>
                    </Button>
                  )}
                  {currentUserId === comment.user_id && (
                    <>
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
                    </>
                  )}
                </div>
              </>
            )}

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2 p-3 bg-muted/50 rounded-lg">
                <Textarea
                  placeholder={t('blog.comments.replyPlaceholder', 'Escreva sua resposta...')}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                  maxLength={1000}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {replyContent.length}/1000
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleCancelReply}
                      className="h-7"
                    >
                      {t('common.cancel', 'Cancelar')}
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={submitting || !replyContent.trim()}
                      className="h-7 gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {t('blog.comments.send', 'Enviar')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Render replies recursively */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-card/50 border-border/50 mt-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5 text-primary" />
          {t('blog.comments.title', 'Comentários')} 
          <span className="text-sm font-normal text-muted-foreground">
            ({totalCount})
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
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
