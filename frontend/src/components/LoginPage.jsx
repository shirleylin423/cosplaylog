import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";


export default function LoginPage() {
  const {
    login,
    register,
  } = useApp();

  const [mode, setMode] =
    useState("login");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(event) {
    event.preventDefault();

    const cleanUsername =
      username.trim();

    if (!cleanUsername) {
      toast.error("請輸入使用者名稱");
      return;
    }

    if (!password) {
      toast.error("請輸入密碼");
      return;
    }


    if (mode === "register") {

      if (password.length < 8) {
        toast.error(
          "密碼至少需要 8 個字元"
        );
        return;
      }

      if (
        password !== confirmPassword
      ) {
        toast.error(
          "兩次輸入的密碼不一致"
        );
        return;
      }
    }


    try {
      setLoading(true);


      if (mode === "login") {

        await login(
          cleanUsername,
          password
        );

        toast.success(
          "登入成功！"
        );

        return;
      }


      await register(
        cleanUsername,
        password
      );


      await login(
        cleanUsername,
        password
      );


      toast.success(
        "註冊成功，歡迎使用！"
      );

    } catch (error) {

      toast.error(
        error?.message ||
        "操作失敗，請稍後再試"
      );

    } finally {
      setLoading(false);
    }
  }


  function switchMode() {
    setMode((current) =>
      current === "login"
        ? "register"
        : "login"
    );

    setPassword("");
    setConfirmPassword("");
  }


  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-header">

          <div className="login-logo">
            ✦
          </div>

          <h1>
            Cosplay Diary
          </h1>

          <p>
            記錄你的每一次 Cosplay
          </p>

        </div>


        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          <label>
            使用者名稱
          </label>

          <input
            type="text"
            value={username}
            onChange={(event) =>
              setUsername(
                event.target.value
              )
            }
            placeholder="請輸入使用者名稱"
            autoComplete="username"
            disabled={loading}
          />


          <label>
            密碼
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="至少 8 個字元"
            autoComplete={
              mode === "login"
                ? "current-password"
                : "new-password"
            }
            disabled={loading}
          />


          {mode === "register" && (
            <>
              <label>
                再輸入一次密碼
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="再次輸入密碼"
                autoComplete="new-password"
                disabled={loading}
              />
            </>
          )}


          <button
            type="submit"
            disabled={loading}
            className="login-submit"
          >
            {loading
              ? "處理中..."
              : mode === "login"
                ? "登入"
                : "建立帳號"}
          </button>

        </form>


        <div className="login-switch">

          {mode === "login"
            ? "還沒有帳號？"
            : "已經有帳號？"}

          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {mode === "login"
              ? "立即註冊"
              : "返回登入"}
          </button>

        </div>

      </div>

    </div>
  );
}
