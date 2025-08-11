import React, { useEffect, useState } from 'react';
import { Toast } from 'antd-mobile';
import { UserService } from '../services/userService';
import type { LevelInfo as LevelInfoType, LevelConfig } from '../services/userService';
import './LevelInfo.scss';

interface LevelInfoProps {
  className?: string;
}

const LevelInfo: React.FC<LevelInfoProps> = ({ className }) => {
  const [levelInfo, setLevelInfo] = useState<LevelInfoType | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取等级信息
  const fetchLevelInfo = async () => {
    try {
      setLoading(true);
      const info = await UserService.getLevelInfo();
      setLevelInfo(info);
    } catch (error) {
      console.error('获取等级信息失败:', error);
      Toast.show('获取等级信息失败');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchLevelInfo();
  }, []);

  if (loading || !levelInfo) {
    return (
      <div className={`level-info-container ${className || ''}`}>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const { currentLevelConfig, nextLevelConfig, progress, expToNext } = levelInfo;

  return (
    <div className={`level-info-container ${className || ''}`}>
      {/* 等级标题区域 */}
      <div className="level-header">
        <div className="level-badge">
          <span className="level-text">LV{levelInfo.currentLevel}</span>
          <span className="level-name">{currentLevelConfig.name}</span>
        </div>
        <div className="exp-info">
          <span className="current-exp">{levelInfo.experience}</span>
          {nextLevelConfig && (
            <>
              <span className="separator"> / </span>
              <span className="next-exp">{nextLevelConfig.exp}</span>
            </>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {nextLevelConfig ? (
            <span>距离下一级还需 {expToNext} 经验</span>
          ) : (
            <span>已达到最高等级</span>
          )}
        </div>
      </div>


    </div>
  );
};

export default LevelInfo;