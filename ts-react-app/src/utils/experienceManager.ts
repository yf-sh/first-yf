import { UserService } from '../services/userService';
import { Toast } from 'antd-mobile';

// 经验值获取规则
export const EXP_RULES = {
  // 用户基础行为
  LOGIN: { amount: 10, reason: '每日登录' },
  REGISTER: { amount: 50, reason: '注册账号' },
  COMPLETE_PROFILE: { amount: 30, reason: '完善个人信息' },
  
  // 内容相关行为
  UPLOAD_VIDEO: { amount: 100, reason: '上传视频' },
  POST_COMMENT: { amount: 5, reason: '发表评论' },
  RECEIVE_LIKE: { amount: 2, reason: '获得点赞' },
  SHARE_CONTENT: { amount: 15, reason: '分享内容' },
  
  // 社交行为
  FOLLOW_USER: { amount: 5, reason: '关注用户' },
  BE_FOLLOWED: { amount: 10, reason: '被人关注' },
  
  // 特殊成就
  FIRST_VIDEO: { amount: 200, reason: '首次发布视频' },
  FIRST_HUNDRED_LIKES: { amount: 500, reason: '首次获得100个赞' },
  CONSECUTIVE_LOGIN_7: { amount: 100, reason: '连续登录7天' },
  CONSECUTIVE_LOGIN_30: { amount: 500, reason: '连续登录30天' },
  
  // 活动相关
  PARTICIPATE_ACTIVITY: { amount: 50, reason: '参与活动' },
  WIN_COMPETITION: { amount: 1000, reason: '赢得比赛' },
  
  // VIP相关
  BECOME_VIP: { amount: 1000, reason: '成为VIP会员' },
  VIP_DAILY_BONUS: { amount: 20, reason: 'VIP每日奖励' }
} as const;

export type ExpRuleKey = keyof typeof EXP_RULES;

class ExperienceManager {
  private static instance: ExperienceManager;
  private dailyExpCache: Map<string, number> = new Map();
  private readonly MAX_DAILY_EXP = 1000; // 每日最大经验值限制

  private constructor() {}

  static getInstance(): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager();
    }
    return ExperienceManager.instance;
  }

  /**
   * 奖励经验值
   * @param ruleKey 经验值规则键
   * @param multiplier 倍数（可选）
   * @param customReason 自定义原因（可选）
   */
  async awardExperience(
    ruleKey: ExpRuleKey, 
    multiplier: number = 1,
    customReason?: string
  ): Promise<boolean> {
    try {
      const rule = EXP_RULES[ruleKey];
      const amount = rule.amount * multiplier;
      const reason = customReason || rule.reason;

      // 检查每日经验值限制
      const today = new Date().toDateString();
      const todayExp = this.dailyExpCache.get(today) || 0;
      
      if (todayExp + amount > this.MAX_DAILY_EXP) {
        Toast.show('今日经验值已达上限');
        return false;
      }

      const result = await UserService.addExperience({
        amount,
        reason
      });

      // 更新每日经验值缓存
      this.dailyExpCache.set(today, todayExp + amount);

      // 显示获得经验值的消息
      if (result.levelUp) {
        Toast.show(`🎉 恭喜升级到 LV${result.newLevel}!`);
      } else {
        Toast.show(`+${amount} 经验值 (${reason})`);
      }

      return true;
    } catch (error) {
      console.error('奖励经验值失败:', error);
      return false;
    }
  }

  /**
   * 批量奖励经验值
   * @param rules 经验值规则数组
   */
  async awardMultipleExperience(rules: Array<{
    ruleKey: ExpRuleKey;
    multiplier?: number;
    customReason?: string;
  }>): Promise<boolean> {
    try {
      let totalAmount = 0;
      const reasons: string[] = [];

      // 计算总经验值
      for (const rule of rules) {
        const expRule = EXP_RULES[rule.ruleKey];
        const amount = expRule.amount * (rule.multiplier || 1);
        totalAmount += amount;
        reasons.push(rule.customReason || expRule.reason);
      }

      // 检查每日经验值限制
      const today = new Date().toDateString();
      const todayExp = this.dailyExpCache.get(today) || 0;
      
      if (todayExp + totalAmount > this.MAX_DAILY_EXP) {
        Toast.show('今日经验值已达上限');
        return false;
      }

      const result = await UserService.addExperience({
        amount: totalAmount,
        reason: reasons.join(', ')
      });

      // 更新每日经验值缓存
      this.dailyExpCache.set(today, todayExp + totalAmount);

      // 显示获得经验值的消息
      if (result.levelUp) {
        Toast.show(`🎉 恭喜升级到 LV${result.newLevel}!`);
      } else {
        Toast.show(`+${totalAmount} 经验值`);
      }

      return true;
    } catch (error) {
      console.error('批量奖励经验值失败:', error);
      return false;
    }
  }

  /**
   * 获取今日已获得的经验值
   */
  getTodayExperience(): number {
    const today = new Date().toDateString();
    return this.dailyExpCache.get(today) || 0;
  }

  /**
   * 获取今日剩余可获得的经验值
   */
  getRemainingTodayExperience(): number {
    return Math.max(0, this.MAX_DAILY_EXP - this.getTodayExperience());
  }

  /**
   * 重置每日经验值缓存（新的一天）
   */
  resetDailyCache(): void {
    this.dailyExpCache.clear();
  }

  /**
   * 检查是否可以获得经验值
   */
  canAwardExperience(amount: number): boolean {
    const remaining = this.getRemainingTodayExperience();
    return amount <= remaining;
  }
}

// 导出单例实例
export const experienceManager = ExperienceManager.getInstance();

// 便捷方法
export const awardExp = (ruleKey: ExpRuleKey, multiplier?: number, customReason?: string) => {
  return experienceManager.awardExperience(ruleKey, multiplier, customReason);
};

export const awardMultiExp = (rules: Array<{
  ruleKey: ExpRuleKey;
  multiplier?: number;
  customReason?: string;
}>) => {
  return experienceManager.awardMultipleExperience(rules);
};

export default experienceManager;