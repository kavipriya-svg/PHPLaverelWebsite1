import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, MoreHorizontal, Shield, UserPlus, Loader2, Eye, EyeOff, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, AdminRole } from "@shared/schema";

interface UserWithRole extends User {
  adminRoleName?: string;
}

export default function AdminUsersList() {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminFirstName, setNewAdminFirstName] = useState("");
  const [newAdminLastName, setNewAdminLastName] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ["/api/admin/users/admins", { search }],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/admins"] });
      toast({ title: "User role updated" });
      setEditUser(null);
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
      const res = await apiRequest("POST", "/api/admin/users/create-admin", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/admins"] });
      toast({ title: "Admin user created successfully" });
      setShowAddDialog(false);
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminFirstName("");
      setNewAdminLastName("");
      setNewAdminRole("admin");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create admin", description: error.message, variant: "destructive" });
    },
  });

  const users = data?.users || [];

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      case "support":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleCreateAdmin = () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminFirstName) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createAdminMutation.mutate({
      email: newAdminEmail,
      password: newAdminPassword,
      firstName: newAdminFirstName,
      lastName: newAdminLastName,
      role: newAdminRole,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
            <p className="text-muted-foreground">Manage admin, manager, and support staff accounts</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-admin">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search admin users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-admins"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} data-testid={`row-admin-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>
                            {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.firstName ? `${user.firstName} ${user.lastName || ""}` : "Admin User"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-admin-actions-${user.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditUser(user);
                            setNewRole(user.role);
                          }}>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Admin Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={editUser?.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {editUser?.firstName?.[0] || editUser?.email?.[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {editUser?.firstName ? `${editUser.firstName} ${editUser.lastName || ""}` : "Admin User"}
                  </p>
                  <p className="text-sm text-muted-foreground">{editUser?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger data-testid="select-admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUser(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => editUser && updateRoleMutation.mutate({ id: editUser.id, role: newRole })}
                disabled={updateRoleMutation.isPending}
                data-testid="button-save-admin-role"
              >
                {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Admin User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={newAdminFirstName}
                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                    placeholder="John"
                    data-testid="input-admin-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={newAdminLastName}
                    onChange={(e) => setNewAdminLastName(e.target.value)}
                    placeholder="Doe"
                    data-testid="input-admin-lastname"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                    data-testid="input-admin-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={newAdminRole} onValueChange={setNewAdminRole}>
                  <SelectTrigger data-testid="select-new-admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAdmin}
                disabled={createAdminMutation.isPending}
                data-testid="button-create-admin"
              >
                {createAdminMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
