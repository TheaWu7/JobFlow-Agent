import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import styles from "./AuthHeader.module.css";

export default async function AuthHeader() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return (
    <div className={styles.wrap}>
      <span className={styles.avatar} title={user.email} aria-label={user.email}>
        {user.email.charAt(0).toUpperCase()}
      </span>
      <form action={logout}>
        <button type="submit" className={styles.logout}>
          退出
        </button>
      </form>
    </div>
  );
}
