import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Building2, Globe } from "lucide-react";

interface WhitelistedIP {
  id: string;
  ip_address: string;
  description: string | null;
  organization: string | null;
  created_at: string;
  is_active: boolean;
}

export function IPWhitelistWidget() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newOrg, setNewOrg] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: whitelist, isLoading } = useQuery({
    queryKey: ["ip-whitelist"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_ip_whitelist");
      if (error) throw error;
      return data as WhitelistedIP[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_add_ip_whitelist", {
        p_ip_address: newIP,
        p_description: newDescription || null,
        p_organization: newOrg || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("IP adicionado à whitelist");
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
      setNewIP("");
      setNewOrg("");
      setNewDescription("");
      setShowAddForm(false);
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Este IP já está na whitelist");
      } else {
        toast.error("Erro ao adicionar IP");
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_remove_ip_whitelist", {
        p_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("IP removido da whitelist");
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erro ao remover IP");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.rpc("admin_toggle_ip_whitelist", {
        p_id: id,
        p_is_active: isActive,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handleAdd = () => {
    if (!newIP.trim()) {
      toast.error("Informe o endereço IP");
      return;
    }
    addMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Whitelist de IPs Corporativos
        </CardTitle>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "outline" : "default"}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar IP
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ip">Endereço IP *</Label>
                <Input
                  id="ip"
                  placeholder="192.168.1.1"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="org">Organização</Label>
                <Input
                  id="org"
                  placeholder="Nome da empresa"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição</Label>
              <Input
                id="desc"
                placeholder="Escritório principal, filial, etc."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}

        {!whitelist?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum IP na whitelist</p>
            <p className="text-sm">
              Adicione IPs corporativos para ignorá-los na análise de fraude
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {whitelist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                          {item.ip_address}
                        </code>
                        {item.is_active ? (
                          <Badge variant="default" className="text-xs">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      {(item.organization || item.description) && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {item.organization && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {item.organization}
                            </span>
                          )}
                          {item.description && (
                            <span>• {item.description}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: item.id, isActive: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover IP da whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              Este IP voltará a ser considerado na análise de fraude de
              referrals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && removeMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
