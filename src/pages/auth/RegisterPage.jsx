import AuthLayout from "../../components/layouts/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import RegisterForm from "../../components/auth/RegisterForm";

const RegisterPage = () => {
  return (
    <AuthLayout>
      <AuthCard
        title="Create your account"
        subtitle="Join Sprintory and start managing your projects effectively with your team."
      >
        <RegisterForm />
      </AuthCard>
    </AuthLayout>
  );
};

export default RegisterPage;
