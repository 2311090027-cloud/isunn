import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";

type EditableField = {
  key: keyof Pick<User, "displayName" | "username" | "email" | "phone">;
  label: string;
  type?: string;
};

const PERSONAL_FIELDS: EditableField[] = [
  { key: "displayName", label: "Tên hiển thị" },
  { key: "username", label: "Tên người dùng" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Số điện thoại" },
];

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (userInfo) {
      setFormData({
        _id: userInfo._id,
        displayName: userInfo.displayName || "",
        username: userInfo.username || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        bio: userInfo.bio || "",
      });
    }
  }, [userInfo]);

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData.displayName || formData.displayName.trim() === "") {
      toast.error("Tên hiển thị không thể trống");
      return;
    }

    try {
      setIsLoading(true);
      const updatePayload = {
        displayName: formData.displayName?.trim() || "",
        bio: formData.bio?.trim() || "",
        phone: formData.phone?.trim() || "",
        email: formData.email?.trim() || "",
      };
      
      console.log("Updating profile with:", updatePayload);
      
      const response = await userService.updateProfile(updatePayload);

      // Update the auth store with new user data
      setUser(response.user);
      setHasChanges(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message || error.message || "Lỗi xảy ra khi cập nhật";
      console.error("Error details:", error.response?.data);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (userInfo) {
      setFormData({
        _id: userInfo._id,
        displayName: userInfo.displayName || "",
        username: userInfo.username || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
        bio: userInfo.bio || "",
      });
    }
    setHasChanges(false);
  };

  if (!userInfo) return null;

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAL_FIELDS.map(({ key, label, type }) => (
            <div
              key={key}
              className="space-y-2"
            >
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type={type ?? "text"}
                value={String(formData[key] ?? "")}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={key === "username"}
                className="glass-light border-border/30"
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Giới thiệu</Label>
          <Textarea
            id="bio"
            rows={3}
            value={formData.bio ?? ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="glass-light border-border/30 resize-none"
            placeholder="Viết một vài dòng giới thiệu về bản thân..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasChanges || isLoading}
            variant="outline"
            className="glass-light border-border/30"
          >
            Hủy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
