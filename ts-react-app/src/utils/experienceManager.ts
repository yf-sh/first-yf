/**
 * 用户经验值管理系统
 * 
 * 功能说明：
 * - 管理用户经验值获取和升级系统
 * - 支持每日行为限制，防止重复获得经验值
 * - 提供多种经验值获取途径和规则
 * 
 * 使用场景：
 * - 用户完成特定行为后奖励经验值
 * - 每日登录、关注用户、开通会员等
 * - 限制部分行为的每日获取次数
 * 
 * 设计特点：
 * - 单例模式确保全局一致性
 * - 缓存机制提升性能
 * - 灵活的规则配置系统
 */

import { UserService } from '../services/userService';
import { Toast } from 'antd-mobile';

/**
 * 经验值获取规则配置
 * 定义了各种用户行为对应的经验值奖励
 */
export const EXP_RULES = {
  // 用户基础行为 - 日常活跃度相关
  LOGIN: { amount: 10, reason: '每日登录' },                    // 每日限制1次
  REGISTER: { amount: 50, reason: '注册账号' },                 // 一次性奖励
  COMPLETE_PROFILE: { amount: 30, reason: '完善个人信息' },      // 一次性奖励
  
  // 内容相关行为 - 创作和互动相关
  UPLOAD_VIDEO: { amount: 100, reason: '上传视频' },            // 无限制（鼓励创作）
  POST_COMMENT: { amount: 5, reason: '发表评论' },              // 无限制
  RECEIVE_LIKE: { amount: 2, reason: '获得点赞' },              // 无限制（被动获得）
  SHARE_CONTENT: { amount: 15, reason: '分享内容' },            // 无限制
  
  // 社交行为 - 用户关系建立
  FOLLOW_USER: { amount: 5, reason: '关注用户' },               // 无限制（每个用户一次）
  BE_FOLLOWED: { amount: 10, reason: '被人关注' },              // 无限制（被动获得）
  
  // 特殊成就 - 里程碑奖励
  FIRST_VIDEO: { amount: 200, reason: '首次发布视频' },         // 一次性成就
  FIRST_HUNDRED_LIKES: { amount: 500, reason: '首次获得100个赞' }, // 一次性成就
  CONSECUTIVE_LOGIN_7: { amount: 100, reason: '连续登录7天' },   // 成就奖励
  CONSECUTIVE_LOGIN_30: { amount: 500, reason: '连续登录30天' }, // 成就奖励
  
  // VIP相关 - 付费用户特权
  BECOME_VIP: { amount: 500, reason: '成为VIP会员' },          // 每次开通一次（限制）
  VIP_DAILY_BONUS: { amount: 20, reason: 'VIP每日奖励' }       // VIP每日限制1次
} as const;

export type ExpRuleKey = keyof typeof EXP_RULES;

class ExperienceManager {
  private static instance: ExperienceManager;
  private dailyExpCache: Map<string, number> = new Map();
  private dailyActionsCache: Map<string, Set<string>> = new Map(); // 每日行为记录
  private readonly MAX_DAILY_EXP = 1000; // 每日最大经验值限制

  private constructor() {}

  static getInstance(): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager();
    }
    return ExperienceManager.instance;
  }

  /**
   * 检查每日行为是否已执行过
   * @param ruleKey 经验值规则键
   * @param uniqueKey 唯一标识（可选，用于区分同类行为的不同对象）
   */
  private hasPerformedDailyAction(ruleKey: ExpRuleKey, uniqueKey?: string): boolean {
    const today = new Date().toDateString();
    const todayActions = this.dailyActionsCache.get(today) || new Set();
    const actionKey = uniqueKey ? `${ruleKey}_${uniqueKey}` : ruleKey;
    return todayActions.has(actionKey);
  }

  /**
   * 记录每日行为
   * @param ruleKey 经验值规则键
   * @param uniqueKey 唯一标识（可选）
   */
  private recordDailyAction(ruleKey: ExpRuleKey, uniqueKey?: string): void {
    const today = new Date().toDateString();
    const todayActions = this.dailyActionsCache.get(today) || new Set();
    const actionKey = uniqueKey ? `${ruleKey}_${uniqueKey}` : ruleKey;
    todayActions.add(actionKey);
    this.dailyActionsCache.set(today, todayActions);
  }

  /**
   * 奖励经验值
   * @param ruleKey 经验值规则键
   * @param multiplier 倍数（可选）
   * @param customReason 自定义原因（可选）
   * @param uniqueKey 唯一标识（可选，用于区分同类行为的不同对象）
   * @param isOnceDaily 是否为每日限制一次的行为（可选）
   */
  async awardExperience(
    ruleKey: ExpRuleKey, 
    multiplier: number = 1,
    customReason?: string,
    uniqueKey?: string,
    isOnceDaily: boolean = false
  ): Promise<boolean> {
    try {
      const rule = EXP_RULES[ruleKey];
      const amount = rule.amount * multiplier;
      const reason = customReason || rule.reason;

      // 检查是否为每日限制行为
      if (isOnceDaily && this.hasPerformedDailyAction(ruleKey, uniqueKey)) {
        console.log(`今日已执行过此行为: ${reason}`);
        return false;
      }

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

      // 记录每日行为
      if (isOnceDaily) {
        this.recordDailyAction(ruleKey, uniqueKey);
      }

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
    this.dailyActionsCache.clear();
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
export const awardExp = (
  ruleKey: ExpRuleKey, 
  multiplier?: number, 
  customReason?: string,
  uniqueKey?: string,
  isOnceDaily?: boolean
) => {
  return experienceManager.awardExperience(ruleKey, multiplier, customReason, uniqueKey, isOnceDaily);
};

// 每日登录经验值（限制一次）
export const awardDailyLoginExp = () => {
  return experienceManager.awardExperience('LOGIN', 1, undefined, undefined, true);
};

// 关注用户经验值
export const awardFollowExp = (userId: string) => {
  return experienceManager.awardExperience('FOLLOW_USER', 1, undefined, userId, false);
};

// 开通会员经验值（限制一次）
export const awardMembershipExp = () => {
  return experienceManager.awardExperience('BECOME_VIP', 1, undefined, undefined, true);
};

export const awardMultiExp = (rules: Array<{
  ruleKey: ExpRuleKey;
  multiplier?: number;
  customReason?: string;
}>) => {
  return experienceManager.awardMultipleExperience(rules);
};

export default experienceManager;