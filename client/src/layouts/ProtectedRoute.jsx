import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-panel-950 px-4 sm:px-6 lg:px-8 text-slate-300">
        <div className="glass-card w-full max-w-xs sm:max-w-sm md:max-w-md px-5 py-4 sm:px-6 sm:py-5 text-center text-sm sm:text-base rounded-xl">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
