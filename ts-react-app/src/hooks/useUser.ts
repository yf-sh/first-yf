import { useState, useEffect, useCallback } from 'react';
import UserService, { User, CreateUserRequest, UpdateUserRequest, LoginRequest } from '../services/userService';

// 用户状态接口
interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 用户列表状态接口
interface UserListState {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
}

// 获取用户信息的Hook
export const useUser = (userId?: string) => {
  const [state, setState] = useState<UserState>({
    user: null,
    loading: false,
    error: null,
  });

  const fetchUser = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await UserService.getUserInfo(id);
      setState({ user, loading: false, error: null });
    } catch (error: any) {
      setState({ user: null, loading: false, error: error.message });
    }
  }, []);

  const updateUser = useCallback(async (userData: UpdateUserRequest) => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const updatedUser = await UserService.updateUser(state.user.id, userData);
      setState({ user: updatedUser, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, [state.user]);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  return {
    ...state,
    fetchUser,
    updateUser,
  };
};

// 获取用户列表的Hook
export const useUserList = () => {
  const [state, setState] = useState<UserListState>({
    users: [],
    total: 0,
    loading: false,
    error: null,
  });

  const fetchUsers = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await UserService.getUserList(params);
      setState({ users: result.users, total: result.total, loading: false, error: null });
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const newUser = await UserService.createUser(userData);
      setState(prev => ({
        users: [...prev.users, newUser],
        total: prev.total + 1,
        loading: false,
        error: null,
      }));
      return newUser;
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await UserService.deleteUser(userId);
      setState(prev => ({
        users: prev.users.filter(user => user.id !== userId),
        total: prev.total - 1,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  }, []);

  return {
    ...state,
    fetchUsers,
    createUser,
    deleteUser,
  };
};

// 认证相关的Hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (loginData: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await UserService.login(loginData);
      setUser(result.user);
      return result;
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await UserService.logout();
      setUser(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await UserService.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error: any) {
      setError(error.message);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 检查是否已登录
  const isAuthenticated = !!user;

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
  };
};

// 使用示例
/*
// 在组件中使用
import React from 'react';
import { useUser, useUserList, useAuth } from '../hooks/useUser';

const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { user, loading, error, updateUser } = useUser(userId);

  const handleUpdate = async () => {
    try {
      await updateUser({ name: '新名字' });
    } catch (error) {
      console.error('更新失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!user) return <div>用户不存在</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button onClick={handleUpdate}>更新用户</button>
    </div>
  );
};

const UserList: React.FC = () => {
  const { users, loading, error, fetchUsers, createUser, deleteUser } = useUserList();

  useEffect(() => {
    fetchUsers({ page: 1, limit: 10 });
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    try {
      await createUser({
        name: '新用户',
        email: 'newuser@example.com',
        password: 'password123',
      });
    } catch (error) {
      console.error('创建用户失败:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error('删除用户失败:', error);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <button onClick={handleCreateUser}>创建用户</button>
      {users.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => handleDeleteUser(user.id)}>删除</button>
        </div>
      ))}
    </div>
  );
};

const LoginForm: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="邮箱"
        value={formData.email}
        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />
      <input
        type="password"
        placeholder="密码"
        value={formData.password}
        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
      />
      <button type="submit" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
      {error && <div>错误: {error}</div>}
    </form>
  );
};
*/ 