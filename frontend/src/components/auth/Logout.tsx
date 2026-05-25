import { Button } from "../ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      // Give it a moment to update state before navigating
      setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 100);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="completeGhost"
      onClick={handleLogout}
      disabled={isLoading}
    >
      <LogOut className="text-destructive" />
      {isLoading ? "Đang thoát..." : "Log out"}
    </Button>
  );
};

export default Logout;
