import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  MessageSquare,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlogComment {
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
  };
}

export default function BlogCommentsModeration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch all comments (admin has access to all)
  const { data: comments, isLoading, refetch } = useQuery({
    queryKey: ['admin-blog-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          profile:profiles!blog_comments_user_id_fkey(display_name, avatar_icon)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BlogComment[];
    }
  });

  // Approve comment mutation
  const approveMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('blog_comments')
        .update({ is_approved: true, is_hidden: false })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-comments'] });
      toast.success('Comentário aprovado');
    },
    onError: () => {
      toast.error('Erro ao aprovar comentário');
    }
  });

  // Hide comment mutation
  const hideMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('blog_comments')
        .update({ is_hidden: true })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-comments'] });
      toast.success('Comentário ocultado');
    },
    onError: () => {
      toast.error('Erro ao ocultar comentário');
    }
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-comments'] });
      toast.success('Comentário excluído');
    },
    onError: () => {
      toast.error('Erro ao excluir comentário');
    }
  });

  // Filter comments by status
  const pendingComments = comments?.filter(c => c.is_hidden && !c.is_approved) || [];
  const approvedComments = comments?.filter(c => c.is_approved && !c.is_hidden) || [];
  const hiddenComments = comments?.filter(c => c.is_hidden) || [];
  const allComments = comments || [];

  const getStatusBadge = (comment: BlogComment) => {
    if (comment.is_hidden) {
      return <Badge variant="destructive" className="gap-1"><EyeOff className="w-3 h-3" /> Oculto</Badge>;
    }
    if (!comment.is_approved) {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" /> Pendente</Badge>;
    }
    return <Badge className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> Aprovado</Badge>;
  };

  const CommentsTable = ({ commentsList }: { commentsList: BlogComment[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Usuário</TableHead>
          <TableHead>Artigo</TableHead>
          <TableHead className="max-w-md">Conteúdo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commentsList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Nenhum comentário encontrado
            </TableCell>
          </TableRow>
        ) : (
          commentsList.map((comment) => (
            <TableRow key={comment.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{comment.profile?.avatar_icon || '👤'}</span>
                  <span className="text-sm font-medium">
                    {comment.profile?.display_name || 'Anônimo'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {comment.article_slug}
                </code>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm line-clamp-2">{comment.content}</p>
              </TableCell>
              <TableCell>{getStatusBadge(comment)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {(comment.is_hidden || !comment.is_approved) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => approveMutation.mutate(comment.id)}
                      disabled={approveMutation.isPending}
                      title="Aprovar"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  {!comment.is_hidden && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => hideMutation.mutate(comment.id)}
                      disabled={hideMutation.isPending}
                      title="Ocultar"
                    >
                      <EyeOff className="w-4 h-4 text-orange-500" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(comment.id)}
                    disabled={deleteMutation.isPending}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Moderação de Comentários</h1>
            <p className="text-muted-foreground">
              Revise e modere comentários do blog
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingComments.length}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedComments.length}</p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <EyeOff className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{hiddenComments.length}</p>
                  <p className="text-sm text-muted-foreground">Ocultos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allComments.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Table with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pendentes ({pendingComments.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Aprovados ({approvedComments.length})
                </TabsTrigger>
                <TabsTrigger value="hidden" className="gap-2">
                  <EyeOff className="w-4 h-4" />
                  Ocultos ({hiddenComments.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Todos ({allComments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <CommentsTable commentsList={pendingComments} />
              </TabsContent>
              <TabsContent value="approved">
                <CommentsTable commentsList={approvedComments} />
              </TabsContent>
              <TabsContent value="hidden">
                <CommentsTable commentsList={hiddenComments} />
              </TabsContent>
              <TabsContent value="all">
                <CommentsTable commentsList={allComments} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
