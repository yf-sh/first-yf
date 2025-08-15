import React, { useEffect, useState } from 'react';
import { Toast } from 'antd-mobile';
import { UserService } from '../services/userService';
import type { LevelInfo as LevelInfoType } from '../services/userService';
import './LevelInfo.scss';

interface LevelInfoProps {
  className?: string;
}

const LevelInfo: React.FC<LevelInfoProps> = ({ className }) => {
  const [levelInfo, setLevelInfo] = useState<LevelInfoType | null>(null);

  // 获取等级信息
  const fetchLevelInfo = async () => {
    try {
      const info = await UserService.getLevelInfo();
      setLevelInfo(info);
    } catch (error) {
      // console.error('获取等级信息失败:', error);
      Toast.show('获取等级信息失败');
    }
  };



  useEffect(() => {
    fetchLevelInfo();
  }, []);

  if (!levelInfo) {
    return null;
  }

  const { currentLevelConfig, nextLevelConfig, progress, expToNext } = levelInfo;

  // 安全检查：确保currentLevelConfig存在
  if (!currentLevelConfig) {
    return null;
  }

  return (
    <div className={`level-info-container ${className || ''}`}>
      {/* 等级标题区域 */}
      <div className="level-header">
        <div className="level-badge">
          <span className="level-text">LV{levelInfo.currentLevel || 1}</span>
          <span className="level-name">{currentLevelConfig?.name || '新手'}</span>
        </div>
        <div className="exp-info">
          <span className="current-exp">{levelInfo.experience || 0}</span>
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
            style={{ width: `${progress || 0}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {nextLevelConfig ? (
            <span>距离下一级还需 {expToNext || 0} 经验</span>
          ) : (
            <span>已达到最高等级</span>
          )}
        </div>
      </div>


    </div>
  );
};

export default LevelInfo;