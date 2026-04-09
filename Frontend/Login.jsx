import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../api/apiClient';
import '../styles/Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (isRegister && !formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError('');

      let response;
      if (isRegister) {
        response = await authAPI.register(
          formData.email,
          formData.password,
          formData.name
        );
      } else {
        response = await authAPI.login(formData.email, formData.password);
      }

      localStorage.setItem('auth-token', response.token);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Authentication failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="login-page">
      <div className="background-elements">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <motion.div
        className="login-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="login-card" variants={itemVariants}>
          <motion.div className="logo-section" variants={itemVariants}>
            <h1 className="app-title">RAG Assistant</h1>
            <p className="app-subtitle">
              Enterprise Knowledge Assistant with AI
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="auth-form"
            variants={itemVariants}
          >
            {isRegister && (
              <motion.div className="form-group" variants={itemVariants}>
                <label htmlFor="name">
                  <User size={18} />
                  <span>Full Name</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  disabled={isLoading}
                  required
                />
              </motion.div>
            )}

            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="email">
                <Mail size={18} />
                <span>Email Address</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={isLoading}
                required
              />
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="password">
                <Lock size={18} />
                <span>Password</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </motion.div>

            {error && (
              <motion.div
                className="error-message"
                variants={itemVariants}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              variants={itemVariants}
            >
              {isLoading ? (
                <>
                  <Loader className="spinner" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
              )}
            </motion.button>
          </motion.form>

          <motion.div className="toggle-auth" variants={itemVariants}>
            <span>
              {isRegister
                ? 'Already have an account? '
                : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setFormData({ email: '', password: '', name: '' });
              }}
              className="toggle-btn"
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </motion.div>
        </motion.div>

        <motion.div className="info-section" variants={itemVariants}>
          <div className="info-card">
            <h3>🚀 Fast Retrieval</h3>
            <p>Vector-based search for instant document retrieval</p>
          </div>
          <div className="info-card">
            <h3>🧠 Smart Responses</h3>
            <p>Claude AI powered answers with cited sources</p>
          </div>
          <div className="info-card">
            <h3>📚 Multi-Domain</h3>
            <p>Organize knowledge across different departments</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
