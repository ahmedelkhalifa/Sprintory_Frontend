import AuthLayout from "../../components/layouts/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import LoginForm from "../../components/auth/LoginForm";

const LoginPage = () => {
  return (
    <AuthLayout heroImage="/images/Login.png">
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your Sprintory account and continue building great projects with your team."
      >
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
};

export default LoginPage;
