/**
 * AU版本绩效状态判定模块
 * 功能：基于AU（Asset Utilization）判定绩效状态，写入Master Data_AU_Version
 * 判定规则：AU_AFTER PM ≥ AU_BEFORE PM → 好/Good，否则 → 差/Bad
 */

const MAIN_SHEET_ID_AU = "1C7z16Ww22dfGxeqKRrBw27J-zmXXStAt2xoEYwL-V24";

function executeAUVersion() {
  try {
    console.log("开始执行AU版本绩效状态判定...");

    const mainSheet = SpreadsheetApp.openById(MAIN_SHEET_ID_AU);
    const auSheet = mainSheet.getSheetByName("Master Data_AU_Version");

    if (!auSheet) {
      console.error("未找到 Master Data_AU_Version Sheet");
      return;
    }

    const data = auSheet.getDataRange().getValues();
    const headers = data[0];

    const auBeforeIdx = headers.indexOf("AU_BEFORE PM");
    const auAfterIdx = headers.indexOf("AU_AFTER PM");
    const perfIdx = headers.indexOf("绩效状态/ Performance Status");

    console.log(`AU_BEFORE PM列索引: ${auBeforeIdx}, AU_AFTER PM列索引: ${auAfterIdx}, 绩效状态列索引: ${perfIdx}`);

    if (auBeforeIdx === -1 || auAfterIdx === -1 || perfIdx === -1) {
      console.error("未找到必要的列");
      return;
    }

    const results = [];
    let goodCount = 0;
    let badCount = 0;

    data.slice(1).forEach((row, index) => {
      const auBefore = parsePercentageAU(row[auBeforeIdx]);
      const auAfter = parsePercentageAU(row[auAfterIdx]);
      const performanceStatus = auAfter >= auBefore ? "好/Good" : "差/Bad";

      results.push([performanceStatus]);

      if (performanceStatus === "好/Good") goodCount++;
      else badCount++;

      if (index < 3) {
        console.log(`第${index + 2}行: AU_BEFORE=${auBefore}, AU_AFTER=${auAfter}, 判定=${performanceStatus}`);
      }
    });

    // 批量写入N列（从第2行开始）
    if (results.length > 0) {
      auSheet.getRange(2, perfIdx + 1, results.length, 1).setValues(results);
    }

    console.log(`AU版本绩效状态判定完成: 好/Good=${goodCount}, 差/Bad=${badCount}, 总计=${results.length}`);

  } catch (error) {
    console.error("执行AU版本绩效状态判定时出错:", error);
    throw error;
  }
}

function parsePercentageAU(value) {
  if (value == null || value === "") return 0;
  const str = String(value).replace("%", "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * AU版本KPI统计
 * 功能：基于Master Data_AU_Version计算KPI并写入KPI Summary_AU_Version
 */
function executeKPISummaryAU() {
  try {
    console.log("开始执行AU版本KPI统计...");

    const mainSheet = SpreadsheetApp.openById(MAIN_SHEET_ID_AU);
    const masterData = getMasterDataAU(mainSheet);
    console.log(`获取Master Data_AU_Version记录数: ${masterData.length}`);

    // 2025年：全年12个月
    const months2025 = [];
    for (let m = 1; m <= 12; m++) months2025.push(`2025${String(m).padStart(2, '0')}`);
    updateKPIDataAU(mainSheet, masterData, months2025, 2025);

    // 2026年：1月到当前月份
    const currentMonth = getCurrentMonthAU();
    const months2026 = generateMonthListAU(currentMonth);
    updateKPIDataAU(mainSheet, masterData, months2026, 2026);

    // YTD
    updateYTDDataAU(mainSheet, masterData, 2025);
    updateYTDDataAU(mainSheet, masterData, 2026);

    console.log("AU版本KPI统计完成");

  } catch (error) {
    console.error("执行AU版本KPI统计时出错:", error);
    throw error;
  }
}

function getMasterDataAU(mainSheet) {
  const auSheet = mainSheet.getSheetByName("Master Data_AU_Version");
  const data = auSheet.getDataRange().getValues();
  const headers = data[0];

  const yearMonthIndex = headers.indexOf("保养月份/ YearMonth");
  const productionStatusIndex = headers.indexOf("生产状态/ Production Status");
  const keyProcessIndex = headers.indexOf("工序/ KeyProcess");
  const subProcessIndex = headers.indexOf("子工序/ SubProcess");
  const performanceStatusIndex = headers.indexOf("绩效状态/ Performance Status");
  const serialNumberIndex = headers.indexOf("序列号/ Serial No.");

  const excludedSerialNumbers = buildKPIExclusionSetAU(mainSheet);
  console.log(`KPI排除序列号数量: ${excludedSerialNumbers.size}`);

  const filteredData = data.slice(1).filter(row => {
    if (row[productionStatusIndex] !== "生产") return false;
    if (excludedSerialNumbers.has(String(row[serialNumberIndex] || ""))) return false;
    return true;
  });

  console.log(`筛选后数据量: ${filteredData.length}`);

  return filteredData.map(row => ({
    yearMonth: String(row[yearMonthIndex] || ""),
    keyProcess: String(row[keyProcessIndex] || ""),
    subProcess: String(row[subProcessIndex] || ""),
    performanceStatus: String(row[performanceStatusIndex] || "")
  }));
}

function buildKPIExclusionSetAU(mainSheet) {
  const excludedSerialNumbers = new Set();

  const exclusionSheet = mainSheet.getSheetByName("KPI排除条件");
  if (!exclusionSheet) return excludedSerialNumbers;

  const ruleData = exclusionSheet.getDataRange().getValues();
  if (ruleData.length <= 1) return excludedSerialNumbers;

  const ruleHeaders = ruleData[0];
  const wcCol = ruleHeaders.indexOf("机台号/Workcenter");
  const durationCol = ruleHeaders.indexOf("排除的保养时间(h)");
  const statusCol = ruleHeaders.indexOf("状态");

  const enabledRules = [];
  ruleData.slice(1).forEach(row => {
    if (String(row[statusCol] || "") !== "启用") return;
    const workcenter = String(row[wcCol] || "").trim();
    const duration = Number(row[durationCol]);
    if (workcenter && !isNaN(duration)) {
      enabledRules.push({ workcenter, duration });
    }
  });

  if (enabledRules.length === 0) return excludedSerialNumbers;

  const pmSheet = mainSheet.getSheetByName("PM Data");
  const pmAllData = pmSheet.getDataRange().getValues();
  const pmHeaders = pmAllData[0];
  const pmAemIdx = pmHeaders.indexOf("AEM#");
  const pmDurationIdx = pmHeaders.indexOf("保养时间");
  const pmDateIdx = pmHeaders.indexOf("开始日期");

  pmAllData.slice(1).forEach(row => {
    const aem = String(row[pmAemIdx] || "");
    const duration = Number(row[pmDurationIdx]);
    for (const rule of enabledRules) {
      if (aem === rule.workcenter && duration === rule.duration) {
        excludedSerialNumbers.add(formatDateAU(row[pmDateIdx]) + aem);
        break;
      }
    }
  });

  return excludedSerialNumbers;
}

function formatDateAU(date) {
  if (!date) return "";
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthAU() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function generateMonthListAU(currentMonth) {
  const months = [];
  const currentYear = parseInt(currentMonth.substring(0, 4));
  const currentMonthNum = parseInt(currentMonth.substring(4, 6));
  for (let month = 1; month <= currentMonthNum; month++) {
    months.push(`${currentYear}${String(month).padStart(2, '0')}`);
  }
  return months;
}

function updateKPIDataAU(mainSheet, masterData, months, year) {
  const kpiData = {};
  const processKeys = ["IM", "TF", "AFT & USW", "HSL & Bou", "Zar", "PK"];

  processKeys.forEach(process => {
    kpiData[process] = {};
    months.forEach(month => {
      kpiData[process][month] = { good: 0, bad: 0, total: 0 };
    });
  });

  masterData.forEach(row => {
    const { yearMonth, keyProcess, subProcess, performanceStatus } = row;
    if (!months.includes(yearMonth)) return;

    if (kpiData[keyProcess]) {
      const d = kpiData[keyProcess][yearMonth];
      if (performanceStatus === "好/Good") d.good++;
      else if (performanceStatus === "差/Bad") d.bad++;
      d.total = d.good + d.bad;
    }

    if (keyProcess === "TF" && kpiData[subProcess]) {
      const d = kpiData[subProcess][yearMonth];
      if (performanceStatus === "好/Good") d.good++;
      else if (performanceStatus === "差/Bad") d.bad++;
      d.total = d.good + d.bad;
    }
  });

  const kpiSheet = mainSheet.getSheetByName("KPI Summary_AU_Version");
  const goalValues = getGoalValuesAU(kpiSheet, year);

  const PROCESS_CONFIG_AU = {
    "IM": { row2025: 2, row2026: 10 },
    "TF": { row2025: 3, row2026: 11 },
    "AFT & USW": { row2025: 4, row2026: 12 },
    "HSL & Bou": { row2025: 5, row2026: 13 },
    "Zar": { row2025: 6, row2026: 14 },
    "PK": { row2025: 7, row2026: 15 }
  };

  const MONTH_COLS = { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 14, 12: 15 };

  Object.keys(PROCESS_CONFIG_AU).forEach(process => {
    const row = year === 2026 ? PROCESS_CONFIG_AU[process].row2026 : PROCESS_CONFIG_AU[process].row2025;
    const goalValue = goalValues[process] || 0;

    months.forEach(month => {
      const monthNum = parseInt(month.substring(4, 6));
      const col = MONTH_COLS[monthNum];
      if (!col) return;

      const data = kpiData[process][month];
      const kpiValue = data.total > 0 ? formatPercentageAU(data.good / data.total) : "-";

      const range = kpiSheet.getRange(row, col);
      range.setValue(kpiValue);

      if (kpiValue !== "-") {
        const kpiNum = parseFloat(kpiValue.replace('%', ''));
        range.setBackground(kpiNum >= goalValue ? '#90EE90' : '#FFB6C1');
      } else {
        range.setBackground(null);
      }
    });
  });

  console.log(`AU版本${year}年月度KPI写入完成`);
}

function getGoalValuesAU(kpiSheet, year) {
  const goalValues = {};
  const PROCESS_CONFIG_AU = {
    "IM": { row2025: 2, row2026: 10 },
    "TF": { row2025: 3, row2026: 11 },
    "AFT & USW": { row2025: 4, row2026: 12 },
    "HSL & Bou": { row2025: 5, row2026: 13 },
    "Zar": { row2025: 6, row2026: 14 },
    "PK": { row2025: 7, row2026: 15 }
  };

  Object.keys(PROCESS_CONFIG_AU).forEach(process => {
    const row = year === 2026 ? PROCESS_CONFIG_AU[process].row2026 : PROCESS_CONFIG_AU[process].row2025;
    const goalCell = kpiSheet.getRange(row, 3);
    const goalValue = goalCell.getValue();
    let goalNum = 0;
    if (typeof goalValue === 'string') {
      goalNum = parseFloat(goalValue.replace('%', '')) || 0;
    } else if (typeof goalValue === 'number') {
      goalNum = goalValue < 1 ? goalValue * 100 : goalValue;
    }
    goalValues[process] = goalNum;
  });

  return goalValues;
}

function updateYTDDataAU(mainSheet, masterData, year) {
  const kpiSheet = mainSheet.getSheetByName("KPI Summary_AU_Version");
  const yearPrefix = year.toString();

  const ytdData = {};
  const processKeys = ["IM", "TF", "AFT & USW", "HSL & Bou", "Zar", "PK"];
  processKeys.forEach(p => { ytdData[p] = { good: 0, bad: 0, total: 0 }; });

  masterData.forEach(row => {
    const { yearMonth, keyProcess, subProcess, performanceStatus } = row;
    if (!yearMonth.startsWith(yearPrefix)) return;

    if (ytdData[keyProcess]) {
      const d = ytdData[keyProcess];
      if (performanceStatus === "好/Good") d.good++;
      else if (performanceStatus === "差/Bad") d.bad++;
      d.total = d.good + d.bad;
    }

    if (keyProcess === "TF" && ytdData[subProcess]) {
      const d = ytdData[subProcess];
      if (performanceStatus === "好/Good") d.good++;
      else if (performanceStatus === "差/Bad") d.bad++;
      d.total = d.good + d.bad;
    }
  });

  const PROCESS_CONFIG_AU = {
    "IM": { row2025: 2, row2026: 10 },
    "TF": { row2025: 3, row2026: 11 },
    "AFT & USW": { row2025: 4, row2026: 12 },
    "HSL & Bou": { row2025: 5, row2026: 13 },
    "Zar": { row2025: 6, row2026: 14 },
    "PK": { row2025: 7, row2026: 15 }
  };

  const goalValues = getGoalValuesAU(kpiSheet, year);

  Object.keys(PROCESS_CONFIG_AU).forEach(process => {
    const row = year === 2026 ? PROCESS_CONFIG_AU[process].row2026 : PROCESS_CONFIG_AU[process].row2025;
    const data = ytdData[process];
    const ytdValue = data.total > 0 ? formatPercentageAU(data.good / data.total) : "-";

    const range = kpiSheet.getRange(row, 16); // P列 = YTD
    range.setValue(ytdValue);

    if (ytdValue !== "-") {
      const ytdNum = parseFloat(ytdValue.replace('%', ''));
      const goalValue = goalValues[process] || 0;
      range.setBackground(ytdNum >= goalValue ? '#90EE90' : '#FFB6C1');
    } else {
      range.setBackground(null);
    }
  });

  console.log(`AU版本${year}年YTD写入完成`);
}

function formatPercentageAU(value) {
  if (typeof value !== 'number' || isNaN(value)) return "0.0%";
  const percentage = value * 100;
  const formatted = percentage.toFixed(1);
  return formatted.replace(/\.0$/, '') + "%";
}
