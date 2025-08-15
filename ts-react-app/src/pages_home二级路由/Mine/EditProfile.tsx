import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Form, Input, Button, Avatar, Toast, TextArea } from 'antd-mobile';
import { LeftOutline, CameraOutline } from 'antd-mobile-icons';
import tokenManager from '../../utils/tokenManager';
import axios from 'axios';
import './EditProfile.scss';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>({
    id: '',
    username: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      const res = await axios.get('http://localhost:9527/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser(res.data.data);
    } catch (error) {
      console.error('Failed to get user info:', error);
      Toast.show('获取用户信息失败');
    }
  };

  // 处理头像选择
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // 处理头像文件选择
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        Toast.show('请选择图片文件');
        return;
      }
      
      // 检查文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Toast.show('图片大小不能超过5MB');
        return;
      }

      setAvatarFile(file);
      
      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      setUser(prev => ({ ...prev, avatar: previewUrl }));
    }
  };

  // 上传头像
  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = tokenManager.getAccessToken();
      const res = await axios.post('http://localhost:9527/api/users/upload-avatar', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        return `http://localhost:9527${res.data.data.avatarUrl}`;
      }
      return null;
    } catch (error) {
      console.error('头像上传失败:', error);
      Toast.show('头像上传失败');
      return null;
    }
  };

  // 更新用户信息
  const updateProfile = async (values: any) => {
    try {
      setLoading(true);
      console.log('表单提交的值:', values);
      
      const token = tokenManager.getAccessToken();
      if (!token) {
        Toast.show('请先登录');
        return;
      }

      let avatarUrl = user.avatar;
      
      // 如果有新头像文件，先上传头像
      if (avatarFile) {
        console.log('上传新头像...');
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // 更新用户信息，包括头像URL
      const updateData = {
        ...values,
        avatar: avatarUrl
      };

      console.log('发送更新请求:', updateData);

      const res = await axios.put('http://localhost:9527/api/users/profile', updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API响应:', res.data);

      if (res.data.success) {
        Toast.show('更新成功');
        // 更新本地存储的用户信息
        const updatedUser = { ...user, ...updateData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        navigate(-1); // 返回上一页
      } else {
        Toast.show(res.data.msg || '更新失败');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMsg = error.response?.data?.msg || error.message || '更新失败';
      Toast.show(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  return (
    <div className="edit-profile-container">
      <NavBar
        left={<LeftOutline onClick={() => navigate(-1)} />}
        className="edit-profile-navbar"
      >
        编辑资料
      </NavBar>

      <div className="edit-profile-content">
        {/* 头像区域 */}
        <div className="avatar-section">
          <div className="avatar-wrapper" onClick={handleAvatarClick}>
            <Avatar 
              src={user.avatar || ''} 
              className="edit-avatar"
              style={{ 
                '--size': '80px',
                '--border-radius': '50%',
                backgroundColor: '#e8f4fd'
              }}
            />
            <div className="avatar-overlay">
              <CameraOutline fontSize={24} />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <div className="avatar-text">点击更换头像</div>
        </div>

        {/* 表单区域 */}
        <Form
          key={user.id} // 添加key来强制重新渲染
          initialValues={user}
          onFinish={updateProfile}
          className="edit-form"
        >
          <Form.Item 
            label="用户名" 
            name="username"
            rules={[
              { min: 2, message: '用户名至少2个字符' },
              { max: 20, message: '用户名不能超过20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item 
            label="邮箱" 
            name="email"
            rules={[
              { type: 'email', message: '请输入正确的邮箱格式' }
            ]}
          >
            <Input placeholder="请输入邮箱" type="email" />
          </Form.Item>



          <Form.Item label="个人简介" name="bio">
            <TextArea 
              placeholder="介绍一下自己吧..." 
              rows={4}
              maxLength={100}
              showCount
            />
          </Form.Item>

          <div className="form-buttons">
            <Button 
              type="submit" 
              color="primary" 
              size="large"
              loading={loading}
              block
            >
              保存修改
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default EditProfile;