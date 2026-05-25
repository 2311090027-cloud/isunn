import { Shield, Bell, ShieldBan, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const PrivacySettings = () => {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Delete account form
  const [deletePassword, setDeletePassword] = useState("");

  const handleChangePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setIsLoading(true);
      await userService.changePassword(passwordForm);
      toast.success(
        "Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới."
      );
      setChangePasswordOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Auto logout after a delay
      setTimeout(() => {
        signOut();
        navigate("/signin");
      }, 2000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(
        error.response?.data?.message || "Lỗi xảy ra khi đổi mật khẩu"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setIsLoading(true);
      await userService.deleteAccount(deletePassword);
      toast.success("Tài khoản của bạn đã được xoá");
      setDeleteAccountOpen(false);
      setDeleteConfirmOpen(false);
      setDeletePassword("");

      // Auto logout and redirect
      setTimeout(() => {
        signOut();
        navigate("/signin");
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Lỗi xảy ra khi xoá tài khoản");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="glass-strong border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Quyền riêng tư & Bảo mật
          </CardTitle>
          <CardDescription>
            Quản lý cài đặt quyền riêng tư và bảo mật của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start glass-light border-border/30 hover:text-warning"
              onClick={() => setChangePasswordOpen(true)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Đổi mật khẩu
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start glass-light border-border/30 hover:text-info"
              disabled
            >
              <Bell className="h-4 w-4 mr-2" />
              Cài đặt thông báo (Sắp có)
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start glass-light border-border/30 hover:text-destructive"
              disabled
            >
              <ShieldBan className="size-4 mr-2" />
              Chặn & Báo cáo (Sắp có)
            </Button>
          </div>

          <div className="pt-4 border-t border-border/30">
            <h4 className="font-medium mb-3 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Khu vực nguy hiểm
            </h4>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setDeleteAccountOpen(true)}
            >
              Xoá tài khoản
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại và mật khẩu mới của bạn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Xác nhận mật khẩu mới"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Xoá tài khoản
            </DialogTitle>
            <DialogDescription>
              Hành động này không thể được hoàn tác. Tất cả dữ liệu của bạn sẽ
              bị xoá vĩnh viễn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive font-medium">
                Bạn chắc chắn muốn xoá tài khoản này? Hành động này không thể
                hoàn tác.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteAccountOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteAccountOpen(false);
                  setDeleteConfirmOpen(true);
                }}
              >
                Tiếp tục
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Password Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xoá tài khoản</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu của bạn để xác nhận xoá tài khoản
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password">Mật khẩu</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletePassword("");
              }}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isLoading || !deletePassword}
            >
              {isLoading ? "Đang xử lý..." : "Xoá tài khoản"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrivacySettings;
