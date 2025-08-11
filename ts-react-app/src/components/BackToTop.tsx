import React, { useState, useEffect } from 'react';
import { UpOutline } from 'antd-mobile-icons';
import './BackToTop.scss';

interface BackToTopProps {
  /** 显示按钮的滚动阈值，默认300px */
  threshold?: number;
  /** 滚动行为，默认smooth */
  behavior?: ScrollBehavior;
}

const BackToTop: React.FC<BackToTopProps> = ({
  threshold = 300,
  behavior = 'smooth'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsVisible(scrollTop > threshold);
    };

    // 立即检查当前状态
    handleScroll();

    // 监听滚动事件，使用节流优化性能
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button 
      className="back-to-top-btn"
      onClick={scrollToTop}
      aria-label="返回顶部"
      title="返回顶部"
    >
      <UpOutline className="back-to-top-icon" />
    </button>
  );
};

export default BackToTop; 