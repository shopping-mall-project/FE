import { logout } from "@/api/logout";
import { useMutation } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["authCheck"], { isLoggedIn: false });
      queryClient.invalidateQueries({ queryKey: ["authCheck"] });
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      router.replace("/");
    },
    onError: (error) => {
      Swal.fire({
        icon: "error",
        title: `로그아웃에 실패했습니다. ${error.message}`,
        showConfirmButton: false,
        timer: 1500,
      });
    },
  });
}
