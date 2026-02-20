import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import loginBg from '../../assets/login-bg.png';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error: authError, isLoading } = useAuth();

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});

  // Validate form
  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};

    if (!username) {
      errors.username = 'Username is required';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log('🔵 [LOGIN] Form submitted');
    console.log('🔵 [LOGIN] Username:', username);

    if (!validateForm()) {
      console.log('🔴 [LOGIN] Form validation failed');
      return;
    }

    console.log('✅ [LOGIN] Form validation passed');

    try {
      console.log('🔵 [LOGIN] Calling login function...');
      const user = await login(username, password);
      console.log('✅ [LOGIN] Login successful!');
      console.log('🔵 [LOGIN] User department (raw):', JSON.stringify(user.department));
      redirectToDepartment(user.department);
    } catch (err) {
      console.error('🔴 [LOGIN] Login failed:', err);
    }
  };

  // Normalize + route based on department
  const redirectToDepartment = (department: string) => {
    // Normalize: trim whitespace, lowercase, remove hyphens and extra spaces
    const normalized = department
      .trim()
      .toLowerCase()
      .replace(/[-_]/g, ' ')       // follow-up → follow up
      .replace(/\s+/g, ' ');       // collapse multiple spaces

    console.log('🔵 [LOGIN] Normalized department:', JSON.stringify(normalized));

    const departmentRoutes: Record<string, string> = {
      // PDO
      'pdo':              '/dashboard/pdo',
      'program':          '/dashboard/pdo',

      // Admin
      'admin':            '/dashboard/admin',
      'administration':   '/dashboard/admin',
      'administrator':    '/dashboard/admin',

      // Laboratory
      'laboratory':       '/dashboard/laboratory',
      'lab':              '/dashboard/laboratory',

      // Follow Up — all variants normalize to 'follow up'
      'follow up':        '/dashboard/followup',
      'followup':         '/dashboard/followup',

      // IT
      'it':               '/dashboard/it-job-order',
      'it job order':     '/dashboard/it-job-order',
      'information technology': '/dashboard/it-job-order',

      // Super user / all
      'all':              '/dashboard/pdo',
    };

    const route = departmentRoutes[normalized];

    if (!route) {
      console.warn(`⚠️ [LOGIN] No route found for department: "${normalized}" — defaulting to /dashboard/pdo`);
    } else {
      console.log('✅ [LOGIN] Redirecting to:', route);
    }

    navigate(route ?? '/dashboard/pdo');
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={formErrors.username ? 'input-error' : ''}
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
            />
            {formErrors.username && (
              <span className="error-message">{formErrors.username}</span>
            )}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={formErrors.password ? 'input-error' : ''}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {formErrors.password && (
              <span className="error-message">{formErrors.password}</span>
            )}
          </div>

          {/* Auth Error Message */}
          {authError && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;