import { redirect } from "next/navigation";

import { ADMIN_DASHBOARD_PATH } from "@/lib/actions/auth-types";

export default function AdminIndexPage() {
  redirect(ADMIN_DASHBOARD_PATH);
}
