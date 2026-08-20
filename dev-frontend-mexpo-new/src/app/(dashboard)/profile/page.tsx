import { redirect } from "next/navigation";

// /profile is now a popup opened from the Navbar user menu (ProfileModal).
// Keep the route so stale links/bookmarks don't 404; just send them home.
export default function ProfileRoute() {
  redirect("/");
}