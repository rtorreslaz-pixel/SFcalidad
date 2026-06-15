import { redirect } from "next/navigation";
import { getCurrentUser, homeRouteForRole } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homeRouteForRole(user.role) : "/login");
}
