"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const result =
      mode === "register"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    // 若邮箱确认未关闭，注册后不会立即返回会话，需要提示用户去验证邮箱
    if (mode === "register" && !result.data.session) {
      setError("注册成功，但需要邮箱验证。请查收邮件后重新登录。");
      setLoading(false);
      return;
    }

    const nextPath = new URLSearchParams(window.location.search).get("next");
    router.replace(nextPath ?? "/");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{mode === "login" ? "登录" : "注册"}</h1>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "登录以继续使用 JobFlow Agent。"
            : "创建账号，开始使用 JobFlow Agent。"}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>邮箱</span>
            <input
              className={styles.input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>密码</span>
            <input
              className={styles.input}
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {mode === "login" ? "登录" : "注册"}
          </button>
        </form>

        <button
          className={styles.switch}
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError("");
          }}
        >
          {mode === "login" ? "还没有账号？注册" : "已有账号？登录"}
        </button>
      </div>
    </main>
  );
}
