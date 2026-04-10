/**
 * 随机日期生成与处理工具
 */
export const DateUtils = {
  /**
   * 在指定范围内生成随机日期字符串 (YYYY-MM-DD)
   * @param {Date} start 
   * @param {Date} end 
   * @returns {string}
   */
  getRandomDate(start, end) {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return d.toISOString().split('T')[0];
  },

  /**
   * 格式化日期对象为字符串
   * @param {Date} date 
   * @returns {string}
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }
};
