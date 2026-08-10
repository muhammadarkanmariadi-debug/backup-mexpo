import UserManager from "@/features/dashboard/users/UserManager";

export const metadata = {
  title: "Manajemen User",
};

export default function UsersRoute() {
  return <UserManager />;
}