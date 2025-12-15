import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Plus, Pencil, Trash2, Loader2, Users, Check, X } from "lucide-react";
import type { AdminRole, RolePermission } from "@shared/schema";

interface AdminModule {
  key: string;
  label: string;
  description: string;
}

interface RoleWithPermissions {
  role: AdminRole;
  permissions: RolePermission[];
}

interface ModulePermission {
  module: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function RolesManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  
  const { toast } = useToast();

  const { data: rolesData, isLoading: rolesLoading } = useQuery<{ roles: AdminRole[] }>({
    queryKey: ["/api/admin/roles"],
  });

  const { data: modulesData } = useQuery<{ modules: AdminModule[] }>({
    queryKey: ["/api/admin/modules"],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: ModulePermission[] }) => {
      return await apiRequest("POST", "/api/admin/roles", data);
    },
    onSuccess: () => {
      toast({ title: "Role created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      resetForm();
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create role", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description: string; permissions: ModulePermission[] } }) => {
      return await apiRequest("PATCH", `/api/admin/roles/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      resetForm();
      setEditingRole(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/roles/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Role deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      setDeleteRoleId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete role", description: error.message, variant: "destructive" });
    },
  });

  const modules = modulesData?.modules || [];
  const roles = rolesData?.roles || [];

  const resetForm = () => {
    setRoleName("");
    setRoleDescription("");
    setModulePermissions([]);
  };

  const initializePermissions = (existingPermissions: RolePermission[] = []) => {
    const perms: ModulePermission[] = modules.map(m => {
      const existing = existingPermissions.find(p => p.module === m.key);
      return {
        module: m.key,
        canView: existing?.canView ?? false,
        canAdd: existing?.canAdd ?? false,
        canEdit: existing?.canEdit ?? false,
        canDelete: existing?.canDelete ?? false,
      };
    });
    setModulePermissions(perms);
  };

  const handleAddRole = () => {
    setRoleName("");
    setRoleDescription("");
    initializePermissions([]);
    setShowAddDialog(true);
  };

  const handleEditRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`);
      const data: RoleWithPermissions = await response.json();
      setEditingRole(data);
      setRoleName(data.role.name);
      setRoleDescription(data.role.description || "");
      initializePermissions(data.permissions);
    } catch (error) {
      toast({ title: "Failed to load role", variant: "destructive" });
    }
  };

  const handleSaveRole = () => {
    const data = {
      name: roleName,
      description: roleDescription,
      permissions: modulePermissions.filter(p => p.canView || p.canAdd || p.canEdit || p.canDelete),
    };

    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.role.id, data });
    } else {
      createRoleMutation.mutate(data);
    }
  };

  const togglePermission = (moduleKey: string, permission: 'canView' | 'canAdd' | 'canEdit' | 'canDelete') => {
    setModulePermissions(prev => prev.map(p => {
      if (p.module === moduleKey) {
        const updated = { ...p, [permission]: !p[permission] };
        if (permission !== 'canView' && updated[permission]) {
          updated.canView = true;
        }
        if (permission === 'canView' && !updated.canView) {
          updated.canAdd = false;
          updated.canEdit = false;
          updated.canDelete = false;
        }
        return updated;
      }
      return p;
    }));
  };

  const toggleAllForModule = (moduleKey: string, value: boolean) => {
    setModulePermissions(prev => prev.map(p => {
      if (p.module === moduleKey) {
        return { ...p, canView: value, canAdd: value, canEdit: value, canDelete: value };
      }
      return p;
    }));
  };

  const getModuleLabel = (key: string): string => {
    const mod = modules.find(m => m.key === key);
    return mod?.label || key;
  };

  const countPermissions = (roleId: string): number => {
    return 0;
  };

  const isDialogOpen = showAddDialog || editingRole !== null;
  const isSaving = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Create and manage admin roles with custom permissions</p>
        </div>
        <Button onClick={handleAddRole} data-testid="button-add-role">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Roles
          </CardTitle>
          <CardDescription>
            Define roles with specific access levels for different admin modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No roles created yet. Click "Add Role" to create your first role.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id} data-testid={`row-role-${role.id}`}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {role.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.isSystemRole ? (
                        <Badge variant="outline">System</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditRole(role.id)}
                          data-testid={`button-edit-role-${role.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!role.isSystemRole && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteRoleId(role.id)}
                            data-testid={`button-delete-role-${role.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingRole(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole 
                ? "Update role details and modify permissions for each module" 
                : "Create a new role with custom permissions for admin modules"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name *</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Product Manager"
                  data-testid="input-role-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Input
                  id="roleDescription"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Brief description of this role"
                  data-testid="input-role-description"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Module Permissions</Label>
              <p className="text-sm text-muted-foreground">
                Select which modules this role can access and what actions they can perform
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Module</TableHead>
                      <TableHead className="text-center w-20">View</TableHead>
                      <TableHead className="text-center w-20">Add</TableHead>
                      <TableHead className="text-center w-20">Edit</TableHead>
                      <TableHead className="text-center w-20">Delete</TableHead>
                      <TableHead className="text-center w-24">All</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => {
                      const perm = modulePermissions.find(p => p.module === module.key);
                      const allChecked = perm?.canView && perm?.canAdd && perm?.canEdit && perm?.canDelete;
                      
                      return (
                        <TableRow key={module.key}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{module.label}</div>
                              <div className="text-xs text-muted-foreground">{module.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canView ?? false}
                              onCheckedChange={() => togglePermission(module.key, 'canView')}
                              data-testid={`checkbox-${module.key}-view`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canAdd ?? false}
                              onCheckedChange={() => togglePermission(module.key, 'canAdd')}
                              data-testid={`checkbox-${module.key}-add`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canEdit ?? false}
                              onCheckedChange={() => togglePermission(module.key, 'canEdit')}
                              data-testid={`checkbox-${module.key}-edit`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={perm?.canDelete ?? false}
                              onCheckedChange={() => togglePermission(module.key, 'canDelete')}
                              data-testid={`checkbox-${module.key}-delete`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={allChecked ?? false}
                              onCheckedChange={(checked) => toggleAllForModule(module.key, !!checked)}
                              data-testid={`checkbox-${module.key}-all`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingRole(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={isSaving || !roleName.trim()}
              data-testid="button-save-role"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRoleId} onOpenChange={(open) => !open && setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? Users assigned to this role will lose their permissions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoleId && deleteRoleMutation.mutate(deleteRoleId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-role"
            >
              {deleteRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
