import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthLayout from "../layouts/AuthLayout";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(form);
      navigate(
        data.user?.onboardingCompleted ? "/app/dashboard" : "/onboarding",
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Control your weight gain, habits, and productivity from one premium workspace."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            className="input-base"
            type="email"
            required
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>
        <div>
          <label
            className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            className="input-base"
            type="password"
            required
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-400">
        New here?{" "}
        <Link
          className="text-accent-500 hover:text-accent-500/80"
          to="/register"
        >
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

export default LoginPage;
