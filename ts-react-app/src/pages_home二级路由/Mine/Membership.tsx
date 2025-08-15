import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Toast } from 'antd-mobile';
import { LeftOutline, StarFill, CheckCircleFill } from 'antd-mobile-icons';
import tokenManager from '../../utils/tokenManager';
import axios from 'axios';
import { awardMembershipExp } from '../../utils/experienceManager';
import './Membership.scss';

interface MembershipPlan {
  id: string;
  name: string;
  duration: number; // 月数
  price: number;
  originalPrice: number;
  discount?: string;
  benefits: string[];
  popular?: boolean;
}



const Membership: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const membershipPlans: MembershipPlan[] = [
    {
      id: 'monthly',
      name: '月会员',
      duration: 1,
      price: 15,
      originalPrice: 15,
      benefits: ['专属头像框', 'VIP标识', '专享内容', '无广告体验']
    },
    {
      id: 'quarterly',
      name: '季会员',
      duration: 3,
      price: 39,
      originalPrice: 45,
      discount: '省6元',
      benefits: ['专属头像框', 'VIP标识', '专享内容', '无广告体验', '专属客服'],
      popular: true
    },
    {
      id: 'yearly',
      name: '年会员',
      duration: 12,
      price: 128,
      originalPrice: 180,
      discount: '省52元',
      benefits: ['专属头像框', 'VIP标识', '专享内容', '无广告体验', '专属客服', '专享活动', '生日礼包']
    }
  ];

  // 获取用户信息
  const getUserInfo = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;
      
      const res = await axios.get('http://localhost:9527/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // console.log('用户信息:', res.data.data);
      setUserInfo(res.data.data);
    } catch (error) {
      // console.error('获取用户信息失败:', error);
    }
  }, []);

  // 检查会员是否过期
  const checkMembershipExpiry = (): { isValid: boolean; message?: string } => {
    if (!userInfo?.membership) {
      return { isValid: true }; // 没有会员信息，可以开通
    }

    const { isActive, endDate } = userInfo.membership;
    
    if (!isActive) {
      return { isValid: true }; // 会员未激活，可以开通
    }

    if (endDate) {
      const now = new Date();
      const membershipEndDate = new Date(endDate);
      
      if (membershipEndDate > now) {
        // 会员还未过期
        const remainingDays = Math.ceil((membershipEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          isValid: false, 
          message: `您的会员还有${remainingDays}天到期，暂无需开通新会员` 
        };
      }
    }

    return { isValid: true }; // 会员已过期，可以开通
  };

  // 开通会员
  const purchaseMembership = useCallback(async () => {
    try {
      setLoading(true);
      
      // 检查会员是否过期
      const membershipCheck = checkMembershipExpiry();
      if (!membershipCheck.isValid) {
        Toast.show(membershipCheck.message || '会员还未过期');
        setLoading(false);
        return;
      }

      const token = tokenManager.getAccessToken();
      if (!token) {
        Toast.show('请先登录');
        return;
      }

      const selectedPlanData = membershipPlans.find(plan => plan.id === selectedPlan);
      if (!selectedPlanData) return;

      // 这里应该调用支付接口，暂时模拟开通成功
      const res = await axios.post('http://localhost:9527/api/users/purchase-membership', {
        planId: selectedPlan,
        duration: selectedPlanData.duration,
        price: selectedPlanData.price
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.data.success) {
        Toast.show('会员开通成功！');
        
        // 奖励开通会员经验值（限制一次）
        awardMembershipExp();
        
        // 刷新用户信息
        await getUserInfo();
        // 返回上一页
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        Toast.show(res.data.msg || '开通失败');
      }
    } catch (error: any) {
      // console.error('开通会员失败:', error);
      const errorMsg = error.response?.data?.msg || error.message || '开通失败';
      
      // 如果是404错误，说明API接口不存在，暂时模拟成功
      if (error.response?.status === 404) {
        Toast.show('会员开通成功！（模拟）');
        
        // 奖励开通会员经验值（限制一次）
        awardMembershipExp();
        
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        Toast.show(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, membershipPlans, userInfo, navigate, getUserInfo]);

  useEffect(() => {
    getUserInfo();
  }, [getUserInfo]);

  // 处理套餐卡片点击
  const handlePlanCardClick = useCallback((planId: string) => {
    setSelectedPlan(planId);
  }, []);

  const selectedPlanData = membershipPlans.find(plan => plan.id === selectedPlan);

  return (
    <div className="membership-container">
      <LeftOutline onClick={() => navigate(-1)} fontSize={24}/>
        开通会员

      <div className="membership-content">
        {/* 会员特权介绍 */}
        <div className="privilege-section">
          <div className="privilege-header">
            <StarFill className="star-icon" />
            <h2>开通大会员，享受专属特权</h2>
          </div>
          
          <div className="privilege-grid">
            <div className="privilege-item">
              <div className="privilege-icon">👑</div>
              <div className="privilege-text">专属身份标识</div>
            </div>
            <div className="privilege-item">
              <div className="privilege-icon">🎬</div>
              <div className="privilege-text">专享优质内容</div>
            </div>
            <div className="privilege-item">
              <div className="privilege-icon">🚫</div>
              <div className="privilege-text">无广告体验</div>
            </div>
            <div className="privilege-item">
              <div className="privilege-icon">🎁</div>
              <div className="privilege-text">专属福利礼包</div>
            </div>
          </div>
        </div>

        {/* 会员套餐选择 */}
        <div className="plans-section">
          <h3>选择套餐</h3>
          <div className="plans-group">
            <Radio.Group 
              value={selectedPlan} 
              onChange={(val) => setSelectedPlan(val as string)}
            >
            {membershipPlans.map((plan) => (
              <div key={plan.id} className="plan-card-wrapper">
                <Radio value={plan.id} />
                <Card 
                  className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => handlePlanCardClick(plan.id)}
                >
                  {plan.popular && (
                    <div className="popular-badge">推荐</div>
                  )}
                  
                  <div className="plan-header">
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-price">
                      <span className="current-price">¥{plan.price}</span>
                      {plan.originalPrice > plan.price && (
                        <>
                          <span className="original-price">¥{plan.originalPrice}</span>
                          <span className="discount">{plan.discount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="plan-benefits">
                    {plan.benefits.map((benefit, index) => (
                      <div key={index} className="benefit-item">
                        <CheckCircleFill className="check-icon" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
            </Radio.Group>
          </div>
        </div>

        {/* 购买按钮 */}
        <div className="purchase-section">
          <div className="price-summary">
            <div className="total-price">
              合计：¥{selectedPlanData?.price}
              {selectedPlanData?.discount && (
                <span className="save-text">（{selectedPlanData.discount}）</span>
              )}
            </div>
          </div>
          
          <Button
            color="primary"
            size="large"
            block
            loading={loading}
            onClick={purchaseMembership}
            className="purchase-btn"
          >
            立即开通{selectedPlanData?.name}
          </Button>
          
          <div className="terms-text">
            开通即表示同意《会员服务协议》和《自动续费协议》
          </div>
        </div>
      </div>
    </div>
  );
};

export default Membership;