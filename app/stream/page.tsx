import { redirect } from "next/navigation";

// The streaming functionality has been merged into /video/[id].
// Redirect any old /stream links to the dashboard.
export default function StreamPage() {
    redirect("/dashboard");
}
