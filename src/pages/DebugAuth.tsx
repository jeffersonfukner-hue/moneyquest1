import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, RefreshCw, Trash2, User, Key, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthEvent {
  id: number;
  timestamp: string;
  event: string;
  hasSession: boolean;
  userId: string | null;
}

const DebugAuth = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [eventCounter, setEventCounter] = useState(0);

  // Only show in development
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setEventCounter(prev => {
        const newId = prev + 1;
        setEvents(current => [
          {
            id: newId,
            timestamp: new Date().toISOString(),
            event,
            hasSession: !!nextSession,
            userId: nextSession?.user?.id || null,
          },
          ...current.slice(0, 49), // Keep last 50 events
        ]);
        return newId;
      });
    });

    return () => subscription.unsubscribe();
  }, [isDev]);

  const handleRefreshSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    console.log('[DebugAuth] Manual getSession:', { data, error });
  };

  const handleClearEvents = () => {
    setEvents([]);
  };

  if (!isDev) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Esta página só está disponível em modo de desenvolvimento.
            </p>
            <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">🔐 Debug Auth</h1>
            <Badge variant={isDev ? "default" : "destructive"}>
              {isDev ? 'DEV' : 'PROD'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefreshSession}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh Session
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearEvents}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear Events
            </Button>
          </div>
        </div>

        {/* Current State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Loading State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={loading ? "secondary" : "default"}>
                {loading ? 'Loading...' : 'Ready'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                User
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-1">
                  <Badge variant="default">Authenticated</Badge>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {user.id}
                  </p>
                </div>
              ) : (
                <Badge variant="secondary">No User</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="w-4 h-4" />
                Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session ? (
                <div className="space-y-1">
                  <Badge variant="default">Active</Badge>
                  <p className="text-xs text-muted-foreground">
                    Expires: {new Date(session.expires_at! * 1000).toLocaleString()}
                  </p>
                </div>
              ) : (
                <Badge variant="secondary">No Session</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Details */}
        {session && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40">
                <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-auto">
                  {JSON.stringify(
                    {
                      access_token: session.access_token?.slice(0, 20) + '...',
                      refresh_token: session.refresh_token?.slice(0, 20) + '...',
                      expires_at: session.expires_at,
                      expires_in: session.expires_in,
                      token_type: session.token_type,
                      user: {
                        id: session.user?.id,
                        email: session.user?.email,
                        created_at: session.user?.created_at,
                        last_sign_in_at: session.user?.last_sign_in_at,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Auth Events Log */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Auth Events (Real-time)</span>
              <Badge variant="outline">{events.length} events</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum evento capturado ainda. Faça login/logout para ver eventos.
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg text-xs"
                    >
                      <span className="text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge
                        variant={
                          evt.event === 'SIGNED_IN'
                            ? 'default'
                            : evt.event === 'SIGNED_OUT'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="shrink-0"
                      >
                        {evt.event}
                      </Badge>
                      <span className="text-muted-foreground">
                        {evt.hasSession ? '✅ Session' : '❌ No session'}
                      </span>
                      {evt.userId && (
                        <span className="font-mono text-muted-foreground truncate">
                          {evt.userId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* localStorage Debug */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Supabase localStorage Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {Object.keys(localStorage)
                  .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
                  .map((key) => (
                    <div key={key} className="text-xs font-mono flex justify-between p-1 bg-muted/50 rounded">
                      <span className="truncate">{key}</span>
                      <span className="text-muted-foreground">
                        {localStorage.getItem(key)?.length || 0} chars
                      </span>
                    </div>
                  ))}
                {Object.keys(localStorage).filter((k) => k.startsWith('sb-') || k.includes('supabase')).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma chave Supabase encontrada
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugAuth;
