import api from "@/lib/axios";
import type { User } from "@/types/user";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.status === 400) {
      throw new Error(res.data.message);
    }

    return res.data;
  },

  updateProfile: async (data: {
    displayName?: string;
    bio?: string;
    phone?: string;
    email?: string;
  }) => {
    const res = await api.patch("/users/profile", data);
    return res.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const res = await api.post("/users/change-password", data);
    return res.data;
  },

  deleteAccount: async (password: string) => {
    const res = await api.delete("/users/account", {
      data: { password },
    });
    return res.data;
  },
};
