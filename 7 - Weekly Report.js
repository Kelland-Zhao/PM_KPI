/**
 * PM周日报自动化系统
 * 基于PM周日报需求文档实现
 * 功能：自动生成和推送PM日报和周报
 * 作者：AI助手
 * 版本：v1.0
 * 日期：2025年1月
 *
 * 参考实现：
 * - 参考了automail.js中的邮件验证、错误处理和日志记录机制
 * - 采用了与automail.js相同的getRecipientsByFunction筛选逻辑
 * - 使用相同的邮件发送方式和HTML生成模式
 *
 * 主要差异：
 * - 数据源不同：本系统使用不同的Google Sheet ID
 * - 功能范围：本系统专注于周报和日报，automail.js包含更多功能
 * - 实现方式：本系统采用模块化设计，各工序独立函数
 */

// ================================
// 1. 基础配置和常量定义
// ================================

// 主数据源配置（用于周日报系统）
// 注意：此数据源与automail.js中使用的数据源不同
// automail.js使用: 15EYFFUoCoHS1LK4Wml31Gy_tYBt3AAPexU7bjoax8AI
// 本系统使用: 1C7z16Ww22dfGxeqKRrBw27J-zmXXStAt2xoEYwL-V24
const PM_REPORT_SHEET_ID = "1C7z16Ww22dfGxeqKRrBw27J-zmXXStAt2xoEYwL-V24";

const SHEET_NAMES = {
  MASTER_DATA: "Master Data",
  KPI_SUMMARY: "KPI Summary",
  NOTIFICATION_LIST: "通知清单",
};

// 工序类型定义
const PROCESS_TYPES = {
  IM: "IM",
  TF: "TF",
  PK: "PK",
};

// 报表类型定义
const REPORT_TYPES = {
  DAILY: "日报",
  WEEKLY: "周报",
};

// 权限类型定义
const FUNCTION_TYPES = {
  PM_WEEKLY: "PM周报",
  IM_DAILY: "IM PM 日报",
  TF_DAILY: "TF PM 日报",
  PK_DAILY: "PK PM 日报",
};

// 邮件配置
const EMAIL_CONFIG = {
  SENDER_NAME: "PM自动化系统",
  DAILY_SUBJECT_PREFIX: "PM日报",
  WEEKLY_SUBJECT_PREFIX: "PM周报",
};

// ================================
// 2. 通知清单数据获取和权限管理
// ================================

/**
 * 使用正则表达式验证邮件地址格式是否有效
 * @param {string} email - 需要验证的邮件地址
 * @returns {boolean} - 如果格式有效则返回 true，否则返回 false
 */
function isValidEmail(email) {
  // 检查输入是否为非空字符串
  if (!email || typeof email !== "string") {
    return false;
  }
  // 一个通用且被广泛接受的电子邮件格式正则表达式
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 获取通知清单Sheet数据
 * @returns {Array} 通知清单数据数组
 */
function getNotificationList() {
  try {
    const sheet = SpreadsheetApp.openById(PM_REPORT_SHEET_ID).getSheetByName(
      SHEET_NAMES.NOTIFICATION_LIST
    );
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    return data.slice(1).map((row) => ({
      Mail: row[headers.indexOf("Mail")],
      Function: row[headers.indexOf("Function")],
    }));
  } catch (error) {
    console.error("获取通知清单数据失败:", error);
    return [];
  }
}

/**
 * 根据功能类型获取接收人列表
 * @param {string} functionType - 功能类型
 * @returns {Array} 接收人邮件地址数组
 */
function getRecipientsByFunction(functionType) {
  const notificationList = getNotificationList();
  const recipientEmails = [];

  notificationList.forEach((item, index) => {
    const email = String(item.Mail || "").trim();
    const functionTypeStr = String(item.Function || "").trim();

    if (
      email &&
      isValidEmail(email) &&
      functionTypeStr.includes(functionType)
    ) {
      recipientEmails.push(email);
      console.log(`添加收件人: ${email} (Function: ${functionTypeStr})`);
    } else if (
      email &&
      isValidEmail(email) &&
      !functionTypeStr.includes(functionType)
    ) {
      console.log(
        `跳过收件人 (行 ${
          index + 1
        }): "${email}" - Function: "${functionTypeStr}" (不包含"${functionType}")`
      );
    } else if (email) {
      console.log(`跳过无效邮件地址格式 (行 ${index + 1}): "${email}"`);
    }
  });

  console.log(
    `找到 ${recipientEmails.length} 个符合条件的收件人 (功能类型: ${functionType})`
  );
  return recipientEmails;
}

/**
 * 检查是否有指定权限
 * @param {Array} notificationList - 通知清单数据
 * @param {string} functionType - 功能类型
 * @returns {boolean} 是否有权限
 */
function hasPermission(notificationList, functionType) {
  return notificationList.some((item) => item.Function.includes(functionType));
}

// ================================
// 3. 数据获取和处理函数
// ================================

/**
 * 获取Master Data Sheet数据（用于周日报系统）
 * @returns {Array} Master Data数据
 */
function getMasterDataForReports() {
  try {
    const sheet = SpreadsheetApp.openById(PM_REPORT_SHEET_ID).getSheetByName(
      SHEET_NAMES.MASTER_DATA
    );
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    return data.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error("获取Master Data失败:", error);
    return [];
  }
}

/**
 * 获取KPI Summary Sheet数据
 * @returns {Array} KPI Summary数据
 */
function getKPISummaryData() {
  try {
    const sheet = SpreadsheetApp.openById(PM_REPORT_SHEET_ID).getSheetByName(
      SHEET_NAMES.KPI_SUMMARY
    );
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    return data.slice(1).map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error("获取KPI Summary数据失败:", error);
    return [];
  }
}

/**
 * 获取当前年份的KPI Summary数据（仅2026年）
 * @returns {Array} 当前年份的KPI Summary数据
 */
function getCurrentYearKPISummaryData() {
  try {
    const sheet = SpreadsheetApp.openById(PM_REPORT_SHEET_ID).getSheetByName(
      SHEET_NAMES.KPI_SUMMARY
    );
    const currentYear = new Date().getFullYear();
    
    // 根据年份确定表头行和数据行
    // 2025年：表头在行1，数据在行2-7
    // 2026年：表头在行9，数据在行10-15
    const headerRow = currentYear === 2026 ? 9 : 1;
    const startRow = currentYear === 2026 ? 10 : 2;
    const endRow = currentYear === 2026 ? 15 : 7;
    
    const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = sheet.getRange(startRow, 1, endRow - startRow + 1, sheet.getLastColumn()).getValues();

    return data.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error("获取当前年份KPI Summary数据失败:", error);
    return [];
  }
}

/**
 * 获取指定工序的数据
 * @param {string} processType - 工序类型
 * @param {string} dateRange - 日期范围（"daily"或"weekly"）
 * @returns {Array} 筛选后的数据
 */
function getProcessData(processType, dateRange = "daily") {
  const masterData = getMasterDataForReports();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYearMonth = `${currentYear}${currentMonth
    .toString()
    .padStart(2, "0")}`;

  console.log(
    `获取${processType}工序${dateRange}数据，Master Data总条数: ${masterData.length}`
  );
  console.log(`当前年月: ${currentYearMonth}`);

  let filteredData = masterData.filter((item) => {
    // 筛选工序 - 使用"工序/ KeyProcess"字段
    if (item["工序/ KeyProcess"] !== processType) return false;

    // 筛选当月数据 - 使用"保养月份/ YearMonth"字段匹配当前年月
    const itemYearMonth = String(item["保养月份/ YearMonth"] || "").trim();
    if (itemYearMonth !== currentYearMonth) {
      console.log(`跳过非当月数据: ${itemYearMonth} !== ${currentYearMonth}`);
      return false;
    }

    // 调试：记录匹配的数据
    console.log(`找到${processType}工序当月数据:`, {
      KeyProcess: item["工序/ KeyProcess"],
      YearMonth: item["保养月份/ YearMonth"],
      Workcenter: item["机台号/ Workcenter"],
      SubProcess: item["子工序/ SubProcess"],
      SerialNo: item["序列号/ Serial No."],
      ProductionStatus: item["生产状态/ Production Status"],
    });

    return true;
  });

  console.log(
    `筛选后${processType}工序${dateRange}数据条数: ${filteredData.length}`
  );
  return filteredData;
}

/**
 * 获取KPI数据概览
 * @returns {Object} KPI数据概览
 */
function getKPIData() {
  const kpiData = getCurrentYearKPISummaryData();
  const currentYear = new Date().getFullYear();
  const ytdKey = `${currentYear}YTD`;
  const kpiOverview = {};

  // 处理KPI数据，转换为易用的格式
  kpiData.forEach((row) => {
    const process = row.Process;
    if (process) {
      // 2026年：列B是"2025 A"，列P是"2026YTD"
      const previousYearA = currentYear === 2026 ? row["2025 A"] : row["2024 A"];
      kpiOverview[process] = {
        previousYearA: previousYearA || "0%",
        Goal: row["Goal"] || "0%",
        Current: row["Current"] || "0%",
        YTD: row[ytdKey] || "0%",
        Status: row["Status"] || "未知",
      };
    }
  });

  return kpiOverview;
}

/**
 * 获取完整KPI数据（用于周报）
 * @returns {Object} 完整KPI数据
 */
function getFullKPIData() {
  const kpiData = getCurrentYearKPISummaryData();
  const currentYear = new Date().getFullYear();
  const ytdKey = `${currentYear}YTD`;
  const fullKPIData = {};

  kpiData.forEach((row) => {
    const process = row.Process;
    if (process) {
      // 根据当前年份动态生成月份键
      const monthKeys = [];
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${currentYear}${month.toString().padStart(2, "0")}`;
        monthKeys.push(monthKey);
      }
      
      // 构建数据对象
      const processData = {
        previousYearA: currentYear === 2026 ? (row["2025 A"] || "0%") : (row["2024 A"] || "0%"),
        Goal: row["Goal"] || "0%",
        Current: row["Current"] || "0%",
      };
      
      // 添加月份数据
      monthKeys.forEach((monthKey) => {
        processData[monthKey] = row[monthKey] || "0%";
      });
      
      // 添加YTD数据
      processData[ytdKey] = row[ytdKey] || "0%";
      
      fullKPIData[process] = processData;
    }
  });

  return fullKPIData;
}

// ================================
// 4. HTML模板生成函数
// ================================

/**
 * 生成日报HTML模板
 * @param {string} processType - 工序类型
 * @param {Object} kpiData - KPI数据
 * @param {Array} maintenanceData - 保养数据
 * @returns {string} HTML内容
 */
function generateDailyHTML(processType, kpiData, maintenanceData) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-CN");

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>PM日报 - ${processType}工序 - ${dateStr}</title>
    <style>
        .header { background-color: #f0f0f0; padding: 15px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .metric-card { border: 1px solid #ddd; margin: 5px; padding: 10px; display: inline-block; width: 30%; }
        .good-status { color: green; font-weight: bold; }
        .bad-status { color: red; font-weight: bold; }
        .kpi-good { background-color: #d4edda; color: #155724; }
        .kpi-bad { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; }
        .info { background-color: #d1ecf1; padding: 10px; border-left: 4px solid #17a2b8; }
        .table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; table-layout: fixed; }
        .table th, .table td { border: 1px solid #ddd; padding: 4px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .table th { background-color: #f2f2f2; font-weight: bold; }
        .table td { max-width: 80px; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; table-layout: fixed; }
        .comparison-table th, .comparison-table td { border: 1px solid #ddd; padding: 4px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .comparison-table th { background-color: #f2f2f2; font-weight: bold; }
        .comparison-table td { max-width: 80px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>PM日报 - ${processType}工序 - ${dateStr}</h2>
    </div>
    
    <!-- 1. 报告说明 / Report Description -->
    <div class="section">
        <h3>&#128203; 报告说明 / Report Description</h3>
        <div class="info">
            <p><strong>日期范围：</strong>上月的21号到这个月的20号</p>
            <p><strong>数据说明：</strong>未达144的未计入KPI计算</p>
            <p><strong>报告日期：</strong>${dateStr}</p>
            <p><strong>工序类型：</strong>${processType}</p>
        </div>
    </div>
    
    <!-- 2. &#128202; KPI数据概览 / KPI Data Overview -->
    <div class="section">
        <h3>&#128202; KPI数据概览 / KPI Data Overview</h3>
        
        <h4>KPI Summary数据</h4>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>工序</th>
                    <th>${new Date().getFullYear() === 2026 ? "2025 A" : "2024 A"}</th>
                    <th>Goal</th>
                    ${(() => {
                      const currentYear = new Date().getFullYear();
                      let headerRow = "";
                      for (let month = 1; month <= 12; month++) {
                        const monthKey = `${currentYear}${month.toString().padStart(2, "0")}`;
                        headerRow += `<th>${monthKey}</th>`;
                      }
                      headerRow += `<th>${currentYear}YTD</th>`;
                      return headerRow;
                    })()}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(kpiData)
                  .map((process) => {
                    const goalValue = parseFloat(kpiData[process]["Goal"] || 0);
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth() + 1; // 1-12
                    const ytdKey = `${currentYear}YTD`;

                    // 生成月份数据，未来月份显示为空
                    const monthData = [];
                    for (let month = 1; month <= 12; month++) {
                      const monthKey = `${currentYear}${month
                        .toString()
                        .padStart(2, "0")}`;
                      const monthValue = kpiData[process][monthKey];

                      if (month > currentMonth) {
                        // 未来月份显示为空
                        monthData.push(`<td>-</td>`);
                      } else {
                        // 当前及过去月份显示数据
                        const formattedValue = formatKPIPercentage(monthValue);

                        // 只有当值不是"-"时才进行目标对比和颜色变化
                        if (formattedValue !== "-") {
                          const monthValueNum = parseFloat(monthValue || 0);
                          const isGoalAchieved = monthValueNum >= goalValue;
                          const cellClass = isGoalAchieved
                            ? "kpi-good"
                            : "kpi-bad";
                          monthData.push(
                            `<td class="${cellClass}">${formattedValue}</td>`
                          );
                        } else {
                          // 值为"-"时不应用背景色
                          monthData.push(`<td>${formattedValue}</td>`);
                        }
                      }
                    }

                    // 处理YTD列的背景色
                    const ytdValue = kpiData[process][ytdKey];
                    const formattedYtdValue = formatKPIPercentage(ytdValue);
                    let ytdCell = "";

                    if (formattedYtdValue !== "-") {
                      const ytdValueNum = parseFloat(ytdValue || 0);
                      const isYtdGoalAchieved = ytdValueNum >= goalValue;
                      const ytdCellClass = isYtdGoalAchieved
                        ? "kpi-good"
                        : "kpi-bad";
                      ytdCell = `<td class="${ytdCellClass}">${formattedYtdValue}</td>`;
                    } else {
                      ytdCell = `<td>${formattedYtdValue}</td>`;
                    }

                    const previousYearA = currentYear === 2026 ? kpiData[process]["previousYearA"] : kpiData[process]["2024A"];

                    return `
                  <tr>
                      <td>${process}</td>
                      <td>${formatKPIPercentage(previousYearA)}</td>
                      <td>${formatKPIPercentage(kpiData[process]["Goal"])}</td>
                      ${monthData.join("")}
                      ${ytdCell}
                  </tr>
                  `;
                  })
                  .join("")}
            </tbody>
        </table>
        
       
    </div>
    
    <!-- 3. &#128295; 详细保养信息 / Detailed Maintenance Information -->
    <div class="section">
        <h3>&#128295; 详细保养信息 / Detailed Maintenance Information</h3>
        
        <h4>${processType}工序保养详细记录</h4>
        <table class="table">
            <thead>
                <tr>
                    <th>保养日期/ PM_Date</th>
                    <th>机台号/ Workcenter</th>
                    <th>Production_AvailableTime_BEFORE PM</th>
                    <th>Production_AvailableTime_AFTER PM</th>
                    <th>AU_BEFORE PM</th>
                    <th>AU_AFTER PM</th>
                    <th>UPDT_BEFORE PM</th>
                    <th>UPDT_AFTER PM</th>
                    <th>保养月份/ YearMonth</th>
                    <th>子工序/ SubProcess</th>
                    <th>生产状态/ Production Status</th>
                    <th>绩效状态/ Performance Status</th>
                    <th>原因/ Reason</th>
                </tr>
            </thead>
            <tbody>
                ${maintenanceData
                  .map(
                    (item, index) => `
                <tr>
                    <td>${formatDateForDisplay(item["保养日期/ PM_Date"])}</td>
                    <td>${item["机台号/ Workcenter"] || ""}</td>
                    <td>${item["Production_AvailableTime_BEFORE PM"] || ""}</td>
                    <td>${item["Production_AvailableTime_AFTER PM"] || ""}</td>
                    <td>${formatPercentage(item["AU_BEFORE PM"])}</td>
                    <td>${formatPercentage(item["AU_AFTER PM"])}</td>
                    <td>${formatPercentage(item["UPDT_BEFORE PM"])}</td>
                    <td>${formatPercentage(item["UPDT_AFTER PM"])}</td>
                    <td>${item["保养月份/ YearMonth"] || ""}</td>
                    <td>${item["子工序/ SubProcess"] || ""}</td>
                    <td>${item["生产状态/ Production Status"] || ""}</td>
                    <td class="${
                      item["绩效状态/ Performance Status"] === "好/Good"
                        ? "good-status"
                        : "bad-status"
                    }">${item["绩效状态/ Performance Status"] || ""}</td>
                    <td>${item["原因/ Reason"] || ""}</td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
        

    </div>
</body>
</html>`;
}

/**
 * 生成周报HTML模板
 * @param {Object} allProcessData - 所有工序数据
 * @param {Object} kpiData - KPI数据
 * @returns {string} HTML内容
 */
function generateWeeklyHTML(allProcessData, kpiData) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekStr = `第${getWeekNumber(today)}周`;
  const dateRange = `${weekStart.toLocaleDateString(
    "zh-CN"
  )} - ${weekEnd.toLocaleDateString("zh-CN")}`;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>PM周报 - ${weekStr}</title>
    <style>
        .weekly-header { background-color: #e3f2fd; padding: 15px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; table-layout: fixed; }
        .comparison-table th, .comparison-table td { border: 1px solid #ddd; padding: 4px; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .comparison-table th { background-color: #f2f2f2; font-weight: bold; }
        .comparison-table td { max-width: 80px; }
        .info { background-color: #d1ecf1; padding: 10px; border-left: 4px solid #17a2b8; }
        .good-status { color: green; font-weight: bold; }
        .bad-status { color: red; font-weight: bold; }
        .kpi-good { background-color: #d4edda; color: #155724; }
        .kpi-bad { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="weekly-header">
        <h2>PM周报 - ${weekStr} (${dateRange})</h2>
    </div>
    
    <!-- 1. 报告说明 / Report Description -->
    <div class="section">
        <h3>&#128203; 报告说明 / Report Description</h3>
        <div class="info">
            <p><strong>日期范围：</strong>上月的21号到这个月的20号</p>
            <p><strong>数据说明：</strong>Production Available Time未达144的未计入KPI计算</p>
            <p><strong>报告周期：</strong>${weekStr} (${dateRange})</p>
        </div>
    </div>
    
    <!-- 2. &#128202; KPI数据概览 / KPI Data Overview -->
    <div class="section">
        <h3>&#128202; KPI数据概览 / KPI Data Overview</h3>
        
        <h4>KPI Summary数据</h4>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>工序</th>
                    <th>${new Date().getFullYear() === 2026 ? "2025 A" : "2024 A"}</th>
                    <th>Goal</th>
                    ${(() => {
                      const currentYear = new Date().getFullYear();
                      let headerRow = "";
                      for (let month = 1; month <= 12; month++) {
                        const monthKey = `${currentYear}${month.toString().padStart(2, "0")}`;
                        headerRow += `<th>${monthKey}</th>`;
                      }
                      headerRow += `<th>${currentYear}YTD</th>`;
                      return headerRow;
                    })()}
                </tr>
            </thead>
            <tbody>
                ${Object.keys(kpiData)
                  .map((process) => {
                    const goalValue = parseFloat(kpiData[process]["Goal"] || 0);
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth() + 1; // 1-12
                    const ytdKey = `${currentYear}YTD`;

                    // 生成月份数据，未来月份显示为空
                    const monthData = [];
                    for (let month = 1; month <= 12; month++) {
                      const monthKey = `${currentYear}${month
                        .toString()
                        .padStart(2, "0")}`;
                      const monthValue = kpiData[process][monthKey];

                      if (month > currentMonth) {
                        // 未来月份显示为空
                        monthData.push(`<td>-</td>`);
                      } else {
                        // 当前及过去月份显示数据
                        const formattedValue = formatKPIPercentage(monthValue);

                        // 只有当值不是"-"时才进行目标对比和颜色变化
                        if (formattedValue !== "-") {
                          const monthValueNum = parseFloat(monthValue || 0);
                          const isGoalAchieved = monthValueNum >= goalValue;
                          const cellClass = isGoalAchieved
                            ? "kpi-good"
                            : "kpi-bad";
                          monthData.push(
                            `<td class="${cellClass}">${formattedValue}</td>`
                          );
                        } else {
                          // 值为"-"时不应用背景色
                          monthData.push(`<td>${formattedValue}</td>`);
                        }
                      }
                    }

                    // 处理YTD列的背景色
                    const ytdValue = kpiData[process][ytdKey];
                    const formattedYtdValue = formatKPIPercentage(ytdValue);
                    let ytdCell = "";

                    if (formattedYtdValue !== "-") {
                      const ytdValueNum = parseFloat(ytdValue || 0);
                      const isYtdGoalAchieved = ytdValueNum >= goalValue;
                      const ytdCellClass = isYtdGoalAchieved
                        ? "kpi-good"
                        : "kpi-bad";
                      ytdCell = `<td class="${ytdCellClass}">${formattedYtdValue}</td>`;
                    } else {
                      ytdCell = `<td>${formattedYtdValue}</td>`;
                    }

                    const previousYearA = currentYear === 2026 ? kpiData[process]["previousYearA"] : kpiData[process]["2024A"];

                    return `
                  <tr>
                      <td>${process}</td>
                      <td>${formatKPIPercentage(previousYearA)}</td>
                      <td>${formatKPIPercentage(kpiData[process]["Goal"])}</td>
                      ${monthData.join("")}
                      ${ytdCell}
                  </tr>
                  `;
                  })
                  .join("")}
            </tbody>
        </table>
        
        
    </div>
    
    <!-- 3. &#128295; 详细保养信息 / Detailed Maintenance Information -->
    <div class="section">
        <h3>&#128295; 详细保养信息 / Detailed Maintenance Information</h3>
        
        <h4>各工序保养详情</h4>
        ${Object.keys(allProcessData)
          .map(
            (processType) => `
        <h5>${processType}工序保养信息</h5>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>保养日期/ PM_Date</th>
                    <th>机台号/ Workcenter</th>
                    <th>Production_AvailableTime_BEFORE PM</th>
                    <th>Production_AvailableTime_AFTER PM</th>
                    <th>AU_BEFORE PM</th>
                    <th>AU_AFTER PM</th>
                    <th>UPDT_BEFORE PM</th>
                    <th>UPDT_AFTER PM</th>
                    <th>保养月份/ YearMonth</th>
                    <th>子工序/ SubProcess</th>
                    <th>生产状态/ Production Status</th>
                    <th>绩效状态/ Performance Status</th>
                    <th>原因/ Reason</th>
                </tr>
            </thead>
            <tbody>
                ${allProcessData[processType]
                  .map(
                    (item, index) => `
                <tr>
                    <td>${formatDateForDisplay(item["保养日期/ PM_Date"])}</td>
                    <td>${item["机台号/ Workcenter"] || ""}</td>
                    <td>${item["Production_AvailableTime_BEFORE PM"] || ""}</td>
                    <td>${item["Production_AvailableTime_AFTER PM"] || ""}</td>
                    <td>${formatPercentage(item["AU_BEFORE PM"])}</td>
                    <td>${formatPercentage(item["AU_AFTER PM"])}</td>
                    <td>${formatPercentage(item["UPDT_BEFORE PM"])}</td>
                    <td>${formatPercentage(item["UPDT_AFTER PM"])}</td>
                    <td>${item["保养月份/ YearMonth"] || ""}</td>
                    <td>${item["子工序/ SubProcess"] || ""}</td>
                    <td>${item["生产状态/ Production Status"] || ""}</td>
                    <td class="${
                      item["绩效状态/ Performance Status"] === "好/Good"
                        ? "good-status"
                        : "bad-status"
                    }">${item["绩效状态/ Performance Status"] || ""}</td>
                    <td>${item["原因/ Reason"] || ""}</td>
                </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
        `
          )
          .join("")}
        
    </div>
</body>
</html>`;
}

/**
 * 获取周数
 * @param {Date} date - 日期
 * @returns {number} 周数
 */
function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDay) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
}

/**
 * 获取格式化的周数（用于邮件标题）
 * @param {Date} date - 日期
 * @returns {string} 格式化的周数，如"WK01"
 */
function getFormattedWeekNumber(date) {
  const weekNumber = getWeekNumber(date);
  return `WK${weekNumber.toString().padStart(2, "0")}`;
}

/**
 * 格式化日期显示为YYYY-MM-DD格式
 * @param {any} dateValue - 日期值
 * @returns {string} 格式化后的日期
 */
function formatDateForDisplay(dateValue) {
  if (!dateValue) return "";

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.log("日期格式化错误:", error, "原始值:", dateValue);
    return String(dateValue);
  }
}

/**
 * 格式化百分比显示
 * @param {any} value - 数值
 * @returns {string} 格式化后的百分比
 */
function formatPercentage(value) {
  if (!value && value !== 0) return "";

  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return String(value);

    // 如果已经是百分比格式，直接返回
    if (String(value).includes("%")) {
      return String(value);
    }

    // 将小数转换为百分比
    const percentage = (numValue * 100).toFixed(1);
    return `${percentage}%`;
  } catch (error) {
    console.log("百分比格式化错误:", error, "原始值:", value);
    return String(value);
  }
}

/**
 * 格式化KPI百分比显示
 * @param {any} value - 数值
 * @returns {string} 格式化后的百分比
 */
function formatKPIPercentage(value) {
  if (!value && value !== 0) return "-";

  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "-";

    // 如果已经是百分比格式，直接返回
    if (String(value).includes("%")) {
      return String(value);
    }

    // 将小数转换为百分比
    const percentage = (numValue * 100).toFixed(1);
    return `${percentage}%`;
  } catch (error) {
    console.log("KPI百分比格式化错误:", error, "原始值:", value);
    return "-";
  }
}

// ================================
// 5. 各工序日报生成函数
// ================================

/**
 * 生成IM工序日报
 */
function generateIMDailyReport() {
  try {
    // 1. 从通知清单Sheet获取IM PM 日报权限人员列表
    const recipients = getRecipientsByFunction(FUNCTION_TYPES.IM_DAILY);
    if (recipients.length === 0) {
      console.log("没有IM PM 日报权限人员，跳过发送");
      return;
    }

    // 2. 获取IM工序相关数据
    const imData = getProcessData(PROCESS_TYPES.IM, "daily");

    // 3. 生成KPI数据概览（来自KPI Summary）
    const kpiData = getFullKPIData();

    // 4. 生成HTML邮件内容
    const htmlContent = generateDailyHTML(PROCESS_TYPES.IM, kpiData, imData);

    // 5. 发送给IM PM 日报权限人员
    const subject = `${EMAIL_CONFIG.DAILY_SUBJECT_PREFIX} - ${PROCESS_TYPES.IM}工序`;
    sendEmail(recipients, subject, htmlContent);

    console.log(`IM日报发送成功，接收人：${recipients.join(", ")}`);
  } catch (error) {
    console.error("IM日报生成失败:", error);
  }
}

/**
 * 生成TF工序日报
 */
function generateTFDailyReport() {
  try {
    // 1. 从通知清单Sheet获取TF PM 日报权限人员列表
    const recipients = getRecipientsByFunction(FUNCTION_TYPES.TF_DAILY);
    if (recipients.length === 0) {
      console.log("没有TF PM 日报权限人员，跳过发送");
      return;
    }

    // 2. 获取TF工序相关数据
    const tfData = getProcessData(PROCESS_TYPES.TF, "daily");

    // 3. 生成KPI数据概览（来自KPI Summary）
    const kpiData = getFullKPIData();

    // 4. 生成HTML邮件内容
    const htmlContent = generateDailyHTML(PROCESS_TYPES.TF, kpiData, tfData);

    // 5. 发送给TF PM 日报权限人员
    const subject = `${EMAIL_CONFIG.DAILY_SUBJECT_PREFIX} - ${PROCESS_TYPES.TF}工序`;
    sendEmail(recipients, subject, htmlContent);

    console.log(`TF日报发送成功，接收人：${recipients.join(", ")}`);
  } catch (error) {
    console.error("TF日报生成失败:", error);
  }
}

/**
 * 生成PK工序日报
 */
function generatePKDailyReport() {
  try {
    // 1. 从通知清单Sheet获取PK PM 日报权限人员列表
    const recipients = getRecipientsByFunction(FUNCTION_TYPES.PK_DAILY);
    if (recipients.length === 0) {
      console.log("没有PK PM 日报权限人员，跳过发送");
      return;
    }

    // 2. 获取PK工序相关数据
    const pkData = getProcessData(PROCESS_TYPES.PK, "daily");

    // 3. 生成KPI数据概览（来自KPI Summary）
    const kpiData = getFullKPIData();

    // 4. 生成HTML邮件内容
    const htmlContent = generateDailyHTML(PROCESS_TYPES.PK, kpiData, pkData);

    // 5. 发送给PK PM 日报权限人员
    const subject = `${EMAIL_CONFIG.DAILY_SUBJECT_PREFIX} - ${PROCESS_TYPES.PK}工序`;
    sendEmail(recipients, subject, htmlContent);

    console.log(`PK日报发送成功，接收人：${recipients.join(", ")}`);
  } catch (error) {
    console.error("PK日报生成失败:", error);
  }
}

// ================================
// 6. 各工序周报生成函数
// ================================

/**
 * 生成IM工序周报
 * @returns {Object} IM工序周报数据
 */
function generateIMWeeklyReport() {
  try {
    // 1. 获取IM工序周数据
    const imData = getProcessData(PROCESS_TYPES.IM, "weekly");

    // 2. 生成完整KPI Summary表格
    const kpiData = getFullKPIData();

    // 3. 生成IM工序详细保养信息
    const maintenanceData = imData;

    // 4. 生成HTML邮件内容
    return {
      processType: PROCESS_TYPES.IM,
      data: imData,
      kpiData: kpiData,
      maintenanceData: maintenanceData,
    };
  } catch (error) {
    console.error("IM周报生成失败:", error);
    return null;
  }
}

/**
 * 生成TF工序周报
 * @returns {Object} TF工序周报数据
 */
function generateTFWeeklyReport() {
  try {
    // 1. 获取TF工序周数据
    const tfData = getProcessData(PROCESS_TYPES.TF, "weekly");

    // 2. 生成完整KPI Summary表格
    const kpiData = getFullKPIData();

    // 3. 生成TF工序详细保养信息
    const maintenanceData = tfData;

    // 4. 生成HTML邮件内容
    return {
      processType: PROCESS_TYPES.TF,
      data: tfData,
      kpiData: kpiData,
      maintenanceData: maintenanceData,
    };
  } catch (error) {
    console.error("TF周报生成失败:", error);
    return null;
  }
}

/**
 * 生成PK工序周报
 * @returns {Object} PK工序周报数据
 */
function generatePKWeeklyReport() {
  try {
    // 1. 获取PK工序周数据
    const pkData = getProcessData(PROCESS_TYPES.PK, "weekly");

    // 2. 生成完整KPI Summary表格
    const kpiData = getFullKPIData();

    // 3. 生成PK工序详细保养信息
    const maintenanceData = pkData;

    // 4. 生成HTML邮件内容
    return {
      processType: PROCESS_TYPES.PK,
      data: pkData,
      kpiData: kpiData,
      maintenanceData: maintenanceData,
    };
  } catch (error) {
    console.error("PK周报生成失败:", error);
    return null;
  }
}

/**
 * 生成综合周报
 */
function generateComprehensiveWeeklyReport() {
  try {
    // 1. 从通知清单Sheet获取PM周报权限人员列表
    const recipients = getRecipientsByFunction(FUNCTION_TYPES.PM_WEEKLY);
    if (recipients.length === 0) {
      console.log("没有PM周报权限人员，跳过发送");
      return;
    }

    // 2. 直接获取所有三道工序的本月数据
    const imData = getProcessData(PROCESS_TYPES.IM, "weekly");
    const tfData = getProcessData(PROCESS_TYPES.TF, "weekly");
    const pkData = getProcessData(PROCESS_TYPES.PK, "weekly");

    // 3. 整合所有工序数据
    const allProcessData = {
      IM: imData,
      TF: tfData,
      PK: pkData,
    };

    console.log("周报数据汇总:", {
      IM: imData.length,
      TF: tfData.length,
      PK: pkData.length,
      总计: imData.length + tfData.length + pkData.length,
    });

    // 4. 生成综合周报HTML
    const kpiData = getFullKPIData();
    const htmlContent = generateWeeklyHTML(allProcessData, kpiData);

    // 5. 发送给所有PM周报权限人员
    const today = new Date();
    const weekNumber = getFormattedWeekNumber(today);
    const subject = `${weekNumber} PM周报 / ${weekNumber} PM Weekly Report`;
    sendEmail(recipients, subject, htmlContent);

    console.log(`综合周报发送成功，接收人：${recipients.join(", ")}`);
  } catch (error) {
    console.error("综合周报生成失败:", error);
  }
}

// ================================
// 7. 主控制函数
// ================================

/**
 * 执行日报生成
 */
function executeDailyReports() {
  console.log("开始执行日报生成...");

  // 1. 从通知清单Sheet获取所有权限信息
  const notificationList = getNotificationList();

  // 2. 根据权限调用对应工序日报函数
  if (hasPermission(notificationList, FUNCTION_TYPES.IM_DAILY)) {
    try {
      generateIMDailyReport();
      console.log("IM日报发送成功");
    } catch (error) {
      console.error("IM日报发送失败:", error);
    }
  }

  if (hasPermission(notificationList, FUNCTION_TYPES.TF_DAILY)) {
    try {
      generateTFDailyReport();
      console.log("TF日报发送成功");
    } catch (error) {
      console.error("TF日报发送失败:", error);
    }
  }

  if (hasPermission(notificationList, FUNCTION_TYPES.PK_DAILY)) {
    try {
      generatePKDailyReport();
      console.log("PK日报发送成功");
    } catch (error) {
      console.error("PK日报发送失败:", error);
    }
  }

  console.log("日报生成完成");
}

/**
 * 执行周报生成
 */
function executeWeeklyReports() {
  console.log("开始执行周报生成...");

  // 1. 从通知清单Sheet检查是否有PM周报权限人员
  const notificationList = getNotificationList();

  if (hasPermission(notificationList, FUNCTION_TYPES.PM_WEEKLY)) {
    try {
      generateComprehensiveWeeklyReport();
      console.log("周报发送成功");
    } catch (error) {
      console.error("周报发送失败:", error);
    }
  } else {
    console.log("没有PM周报权限人员，跳过周报发送");
  }

  console.log("周报生成完成");
}

// ================================
// 8. 定时任务入口函数
// ================================

/**
 * 定时执行日报
 */
function scheduledDailyReports() {
  executeDailyReports();
}

/**
 * 定时执行周报
 */
function scheduledWeeklyReports() {
  executeWeeklyReports();
}

// ================================
// 9. 邮件发送函数
// ================================

/**
 * 发送邮件
 * @param {Array} recipients - 接收人列表
 * @param {string} subject - 邮件主题
 * @param {string} htmlContent - HTML内容
 */
function sendEmail(recipients, subject, htmlContent) {
  try {
    if (recipients.length === 0) {
      console.log("没有接收人，跳过邮件发送");
      return;
    }

    // 验证收件人邮件地址
    const validRecipients = recipients.filter((email) => {
      if (isValidEmail(email)) {
        return true;
      } else {
        console.log(`跳过无效邮件地址: ${email}`);
        return false;
      }
    });

    if (validRecipients.length === 0) {
      console.log("没有有效的收件人，跳过邮件发送");
      return;
    }

    // 使用GmailApp发送邮件
    GmailApp.sendEmail(
      validRecipients.join(","),
      subject,
      "", // 纯文本内容为空
      {
        htmlBody: htmlContent,
        name: EMAIL_CONFIG.SENDER_NAME,
      }
    );

    console.log(
      `邮件发送成功，主题：${subject}，接收人：${validRecipients.length}人`
    );
    console.log(`收件人列表：${validRecipients.join(", ")}`);
  } catch (error) {
    console.error("邮件发送失败:", error);
    console.error("错误详情:", error.message);
    throw error;
  }
}

// ================================
// 10. 测试函数
// ================================

/**
 * 测试日报生成
 */
function testDailyReports() {
  console.log("开始测试日报生成...");
  
  // 固定收件人为测试邮箱
  const testRecipients = ["kelland_zhao@colpal.com"];
  
  try {
    // 1. 获取IM工序相关数据
    const imData = getProcessData(PROCESS_TYPES.IM, "daily");
    const kpiData = getFullKPIData();
    const imHtmlContent = generateDailyHTML(PROCESS_TYPES.IM, kpiData, imData);
    const imSubject = `${EMAIL_CONFIG.DAILY_SUBJECT_PREFIX} - ${PROCESS_TYPES.IM}工序`;
    sendEmail(testRecipients, imSubject, imHtmlContent);
    console.log(`IM日报发送成功，接收人：${testRecipients.join(", ")}`);
    
    // 2. 获取TF工序相关数据
    const tfData = getProcessData(PROCESS_TYPES.TF, "daily");
    const tfHtmlContent = generateDailyHTML(PROCESS_TYPES.TF, kpiData, tfData);
    const tfSubject = `${EMAIL_CONFIG.DAILY_SUBJECT_PREFIX} - ${PROCESS_TYPES.TF}工序`;
    sendEmail(testRecipients, tfSubject, tfHtmlContent);
    console.log(`TF日报发送成功，接收人：${testRecipients.join(", ")}`);
    
    // 3. 获取PK工序相关数据
    const pkData = getProcessData(PROCESS_TYPES.PK, "daily");
    const pkHtmlContent = generateDailyHTML(PROCESS_TYPES.PK, kpiData, pkData);
    const pkSubject = `${EMAIL_CONFIG.DAILY_SUBJECT_PREFIX} - ${PROCESS_TYPES.PK}工序`;
    sendEmail(testRecipients, pkSubject, pkHtmlContent);
    console.log(`PK日报发送成功，接收人：${testRecipients.join(", ")}`);
    
    console.log("测试日报生成完成");
  } catch (error) {
    console.error("测试日报生成失败:", error);
  }
}

/**
 * 测试周报生成
 */
function testWeeklyReports() {
  console.log("开始测试周报生成...");
  
  // 固定收件人为测试邮箱
  const testRecipients = ["kelland_zhao@colpal.com"];
  
  try {
    // 1. 获取所有三道工序的本月数据
    const imData = getProcessData(PROCESS_TYPES.IM, "weekly");
    const tfData = getProcessData(PROCESS_TYPES.TF, "weekly");
    const pkData = getProcessData(PROCESS_TYPES.PK, "weekly");
    
    // 2. 整合所有工序数据
    const allProcessData = {
      IM: imData,
      TF: tfData,
      PK: pkData,
    };

    console.log("周报数据汇总:", {
      IM: imData.length,
      TF: tfData.length,
      PK: pkData.length,
      总计: imData.length + tfData.length + pkData.length,
    });
    
    // 3. 生成综合周报HTML
    const kpiData = getFullKPIData();
    const htmlContent = generateWeeklyHTML(allProcessData, kpiData);
    
    // 4. 发送给测试邮箱
    const today = new Date();
    const weekNumber = getFormattedWeekNumber(today);
    const subject = `${weekNumber} PM周报 / ${weekNumber} PM Weekly Report`;
    sendEmail(testRecipients, subject, htmlContent);
    
    console.log(`测试周报发送成功，接收人：${testRecipients.join(", ")}`);
  } catch (error) {
    console.error("测试周报生成失败:", error);
  }
}

/**
 * 测试数据获取
 */
function testDataRetrieval() {
  console.log("测试数据获取...");

  console.log("通知清单数据:", getNotificationList());
  console.log("Master Data数据条数:", getMasterDataForReports().length);
  console.log("KPI Summary数据条数:", getKPISummaryData().length);

  // 测试Master Data样本数据和字段
  const masterData = getMasterDataForReports();
  if (masterData.length > 0) {
    console.log("Master Data样本数据:", masterData[0]);
    console.log("Master Data字段列表:", Object.keys(masterData[0]));
    console.log("Master Data字段数量:", Object.keys(masterData[0]).length);
  }

  // 测试各工序数据获取
  console.log("=== 日报数据测试 ===");
  console.log(
    "IM工序日报数据条数:",
    getProcessData(PROCESS_TYPES.IM, "daily").length
  );
  console.log(
    "TF工序日报数据条数:",
    getProcessData(PROCESS_TYPES.TF, "daily").length
  );
  console.log(
    "PK工序日报数据条数:",
    getProcessData(PROCESS_TYPES.PK, "daily").length
  );

  console.log("=== 周报数据测试 ===");
  console.log(
    "IM工序周报数据条数:",
    getProcessData(PROCESS_TYPES.IM, "weekly").length
  );
  console.log(
    "TF工序周报数据条数:",
    getProcessData(PROCESS_TYPES.TF, "weekly").length
  );
  console.log(
    "PK工序周报数据条数:",
    getProcessData(PROCESS_TYPES.PK, "weekly").length
  );

  console.log("数据获取测试完成");
}

/**
 * 测试PM详细数据显示
 */
function testPMDataDisplay() {
  console.log("测试PM详细数据显示...");

  // 显示当前年月
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentYearMonth = `${currentYear}${currentMonth
    .toString()
    .padStart(2, "0")}`;
  console.log(`当前年月: ${currentYearMonth}`);

  // 获取所有工序的当月数据
  const imData = getProcessData(PROCESS_TYPES.IM, "weekly");
  const tfData = getProcessData(PROCESS_TYPES.TF, "weekly");
  const pkData = getProcessData(PROCESS_TYPES.PK, "weekly");

  console.log("=== 各工序当月数据详情 ===");
  console.log("IM工序数据条数:", imData.length);
  console.log("TF工序数据条数:", tfData.length);
  console.log("PK工序数据条数:", pkData.length);

  // 显示样本数据
  if (imData.length > 0) {
    console.log("IM工序样本数据:", imData[0]);
    console.log("IM工序样本数据的保养月份:", imData[0]["保养月份/ YearMonth"]);
    console.log(
      "IM工序样本数据的生产状态:",
      imData[0]["生产状态/ Production Status"]
    );
  }
  if (tfData.length > 0) {
    console.log("TF工序样本数据:", tfData[0]);
    console.log("TF工序样本数据的保养月份:", tfData[0]["保养月份/ YearMonth"]);
    console.log(
      "TF工序样本数据的生产状态:",
      tfData[0]["生产状态/ Production Status"]
    );
  }
  if (pkData.length > 0) {
    console.log("PK工序样本数据:", pkData[0]);
    console.log("PK工序样本数据的保养月份:", pkData[0]["保养月份/ YearMonth"]);
    console.log(
      "PK工序样本数据的生产状态:",
      pkData[0]["生产状态/ Production Status"]
    );
  }

  // 测试HTML生成
  const allProcessData = {
    IM: imData,
    TF: tfData,
    PK: pkData,
  };

  const kpiData = getFullKPIData();
  console.log("KPI数据:", kpiData);

  // 生成HTML但不发送邮件
  const htmlContent = generateWeeklyHTML(allProcessData, kpiData);
  console.log("HTML内容长度:", htmlContent.length);
  console.log("HTML内容预览:", htmlContent.substring(0, 500) + "...");

  console.log("PM详细数据显示测试完成");
}

// ================================
// 11. 定时任务设置函数
// ================================

/**
 * 设置日报定时任务（每日18:00）
 */
function setupDailyTrigger() {
  // 删除现有触发器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "scheduledDailyReports") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 创建新的触发器
  ScriptApp.newTrigger("scheduledDailyReports")
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();

  console.log("日报定时任务设置成功：每日18:00执行");
}

/**
 * 设置周报定时任务（每周一09:00）
 */
function setupWeeklyTrigger() {
  // 删除现有触发器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === "scheduledWeeklyReports") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 创建新的触发器
  ScriptApp.newTrigger("scheduledWeeklyReports")
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  console.log("周报定时任务设置成功：每周一09:00执行");
}

/**
 * 设置所有定时任务
 */
function setupAllTriggers() {
  setupDailyTrigger();
  setupWeeklyTrigger();
  console.log("所有定时任务设置完成");
}

/**
 * 删除所有定时任务
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach((trigger) => {
    if (
      trigger.getHandlerFunction() === "scheduledDailyReports" ||
      trigger.getHandlerFunction() === "scheduledWeeklyReports"
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  console.log("所有定时任务已删除");
}

// ================================
// 12. 菜单集成函数
// ================================

/**
 * 添加PM周日报菜单项
 */
function addPMReportMenu() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu("PM周日报系统")
    .addItem("生成日报", "testDailyReports")
    .addItem("生成周报", "testWeeklyReports")
    .addSeparator()
    .addItem("测试数据获取", "testDataRetrieval")
    .addItem("测试PM数据显示", "testPMDataDisplay")
    .addSeparator()
    .addItem("设置定时任务", "setupAllTriggers")
    .addItem("删除定时任务", "deleteAllTriggers")
    .addToUi();

  console.log("PM周日报菜单已添加");
}

// ================================
// 13. 初始化函数
// ================================

/**
 * 系统初始化
 */
function initializePMReportSystem() {
  console.log("初始化PM周日报系统...");

  // 添加菜单
  addPMReportMenu();

  // 测试数据连接
  testDataRetrieval();

  console.log("PM周日报系统初始化完成");
}

// ================================
// 脚本执行入口
// ================================

// 当脚本被加载时自动初始化（用于周日报系统）
function onOpenPMReport() {
  initializePMReportSystem();
}
