/**
 * KPI统计模块
 * 功能：基于Master Data统计各工序KPI并写入KPI Summary sheet
 */

// 使用全局变量（在3 - Data filter & write.js中已定义）


// 工序和子工序配置（2025年和2026年行号）
const PROCESS_CONFIG = {
  "IM": { row2025: 2, row2026: 10, type: "main" },
  "TF": { row2025: 3, row2026: 11, type: "main" },
  "AFT & USW": { row2025: 4, row2026: 12, type: "sub" },
  "HSL & Bou": { row2025: 5, row2026: 13, type: "sub" },
  "Zar": { row2025: 6, row2026: 14, type: "sub" },
  "PK": { row2025: 7, row2026: 15, type: "main" }
};

// 月份列映射（A列=1, B列=2, C列=3, ..., P列=16）
const MONTH_COLUMNS = {
  "202501": 4, "202502": 5, "202503": 6, "202504": 7, "202505": 8,
  "202506": 9, "202507": 10, "202508": 11, "202509": 12, "202510": 13,
  "202511": 14, "202512": 15, "2025YTD": 16,
  "202601": 4, "202602": 5, "202603": 6, "202604": 7, "202605": 8,
  "202606": 9, "202607": 10, "202608": 11, "202609": 12, "202610": 13,
  "202611": 14, "202612": 15, "2026YTD": 16
};

/**
 * 主函数：执行KPI统计
 */
function executeKPISummary() {
  try {
    console.log("开始执行KPI统计...");
    
    // 获取Master Data数据
    const masterData = getMasterData();
    console.log(`获取Master Data记录数: ${masterData.length}`);
    
    // 获取当前月份（用于确定更新范围）
    const currentMonth = getCurrentMonth();
    console.log(`当前月份: ${currentMonth}`);
    
    // 生成月份列表（202501到当前月份）
    const months = generateMonthList(currentMonth);
    console.log(`更新月份范围: ${months.join(", ")}`);
    
    // 计算并更新KPI数据
    updateKPIData(masterData, months);
    
    // 计算并写入年度累计数据
    updateYTDData(masterData);
    
    console.log("KPI统计完成");
    
  } catch (error) {
    console.error("执行KPI统计时出错:", error);
    throw error;
  }
}

/**
 * 获取Master Data数据
 */
function getMasterData() {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const MASTER_DATA_SHEET = MAIN_SHEET.getSheetByName("Master Data");
  
  console.log("开始获取Master Data数据...");
  console.log(`Master Data Sheet名称: ${MASTER_DATA_SHEET.getName()}`);
  console.log(`Master Data Sheet ID: ${MASTER_DATA_SHEET.getParent().getId()}`);
  
  // 检查sheet是否存在数据
  const lastRow = MASTER_DATA_SHEET.getLastRow();
  const lastCol = MASTER_DATA_SHEET.getLastColumn();
  console.log(`Master Data Sheet尺寸: ${lastRow}行 x ${lastCol}列`);
  
  if (lastRow <= 1) {
    console.log("Master Data Sheet没有数据行");
    return [];
  }
  
  const data = MASTER_DATA_SHEET.getDataRange().getValues();
  console.log(`获取到原始数据: ${data.length}行`);
  
  if (data.length === 0) {
    console.log("Master Data Sheet数据为空");
    return [];
  }
  
  const headers = data[0];
  console.log("Master Data表头:", headers);
  
  // 获取列索引
  const yearMonthIndex = headers.indexOf("保养月份/ YearMonth");
  const productionStatusIndex = headers.indexOf("生产状态/ Production Status");
  const keyProcessIndex = headers.indexOf("工序/ KeyProcess");
  const subProcessIndex = headers.indexOf("子工序/ SubProcess");
  const performanceStatusIndex = headers.indexOf("绩效状态/ Performance Status");
  const serialNumberIndex = headers.indexOf("序列号/ Serial No.");

  console.log(`Master Data列索引 - 保养月份: ${yearMonthIndex}, 生产状态: ${productionStatusIndex}, 工序: ${keyProcessIndex}, 子工序: ${subProcessIndex}, 绩效状态: ${performanceStatusIndex}`);

  // 从"KPI排除条件"Sheet读取排除规则，交叉PM Data构建排除清单
  const excludedSerialNumbers = buildKPIExclusionSet(MAIN_SHEET);
  console.log(`KPI排除序列号数量: ${excludedSerialNumbers.size}`);
  
  // 先显示原始数据的前几行用于调试
  console.log("原始数据前3行:");
  data.slice(0, 3).forEach((row, index) => {
    console.log(`第${index}行:`, row);
  });
  
  // 筛选生产状态为"生产"且不在KPI排除清单中的数据
  const filteredData = data.slice(1).filter(row => {
    if (row[productionStatusIndex] !== "生产") return false;
    if (excludedSerialNumbers.has(String(row[serialNumberIndex] || ""))) return false;
    return true;
  });
  
  console.log(`筛选后数据量: ${filteredData.length}`);
  
  // 显示筛选后的前几行数据
  if (filteredData.length > 0) {
    console.log("筛选后数据前3行:");
    filteredData.slice(0, 3).forEach((row, index) => {
      console.log(`筛选后第${index}行:`, row);
    });
  } else {
    console.log("没有数据通过'生产'状态筛选");
    // 检查生产状态列的所有值
    const productionStatusValues = data.slice(1).map(row => row[productionStatusIndex]);
    const uniqueStatusValues = [...new Set(productionStatusValues)];
    console.log("生产状态列的所有唯一值:", uniqueStatusValues);
  }
  
  // 显示前几条数据用于调试
  if (filteredData.length > 0) {
    console.log("前5条数据示例:");
    filteredData.slice(0, 5).forEach((row, index) => {
      console.log(`数据${index + 1}: 年月=${row[yearMonthIndex]}, 工序=${row[keyProcessIndex]}, 子工序=${row[subProcessIndex]}, 绩效状态=${row[performanceStatusIndex]}`);
    });
    
    // 统计202508和202509的数据
    const data202508 = filteredData.filter(row => row[yearMonthIndex] === "202508");
    const data202509 = filteredData.filter(row => row[yearMonthIndex] === "202509");
    console.log(`202508数据量: ${data202508.length}`);
    console.log(`202509数据量: ${data202509.length}`);
    
    // 显示202508的工序分布
    if (data202508.length > 0) {
      const processCount = {};
      data202508.forEach(row => {
        const process = row[keyProcessIndex];
        processCount[process] = (processCount[process] || 0) + 1;
      });
      console.log("202508工序分布:", processCount);
    }
  }
  
  return filteredData.map(row => ({
    yearMonth: String(row[yearMonthIndex] || ""),
    keyProcess: String(row[keyProcessIndex] || ""),
    subProcess: String(row[subProcessIndex] || ""),
    performanceStatus: String(row[performanceStatusIndex] || "")
  }));
}

/**
 * 从"KPI排除条件"Sheet读取规则，结合PM Data构建排除序列号集合
 * @param {Spreadsheet} mainSheet - 主数据Spreadsheet对象
 * @returns {Set<string>} 需排除的序列号集合
 */
function buildKPIExclusionSet(mainSheet) {
  const excludedSerialNumbers = new Set();

  // 读取排除规则配置
  const exclusionSheet = mainSheet.getSheetByName("KPI排除条件");
  if (!exclusionSheet) {
    console.log("未找到'KPI排除条件'Sheet，跳过排除逻辑");
    return excludedSerialNumbers;
  }

  const ruleData = exclusionSheet.getDataRange().getValues();
  if (ruleData.length <= 1) {
    console.log("'KPI排除条件'Sheet无数据行");
    return excludedSerialNumbers;
  }

  const ruleHeaders = ruleData[0];
  const wcCol = ruleHeaders.indexOf("机台号/Workcenter");
  const durationCol = ruleHeaders.indexOf("排除的保养时间(h)");
  const statusCol = ruleHeaders.indexOf("状态");

  // 解析启用的排除规则
  const enabledRules = [];
  ruleData.slice(1).forEach(row => {
    const status = String(row[statusCol] || "");
    if (status !== "启用") return;
    const workcenter = String(row[wcCol] || "").trim();
    const duration = Number(row[durationCol]);
    if (workcenter && !isNaN(duration)) {
      enabledRules.push({ workcenter, duration });
    }
  });

  if (enabledRules.length === 0) {
    console.log("'KPI排除条件'中无启用规则");
    return excludedSerialNumbers;
  }

  console.log(`读取到 ${enabledRules.length} 条KPI排除规则:`, enabledRules);

  // 从PM Data中查找匹配的条目，生成排除序列号
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
        const sn = formatDate(row[pmDateIdx]) + aem;
        excludedSerialNumbers.add(sn);
        break;
      }
    }
  });

  console.log(`根据排除规则生成 ${excludedSerialNumbers.size} 个排除序列号`);
  return excludedSerialNumbers;
}

/**
 * 获取当前月份
 */
function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonth = `${year}${month}`;
  console.log(`当前月份: ${currentMonth}`);
  return currentMonth;
}

/**
 * 生成月份列表
 */
function generateMonthList(currentMonth) {
  const months = [];
  const currentYear = parseInt(currentMonth.substring(0, 4));
  const currentMonthNum = parseInt(currentMonth.substring(4, 6));
  const startMonth = 1;
  
  // 从当前年份的1月开始生成到当前月份
  for (let month = startMonth; month <= 12; month++) {
    const monthStr = `${currentYear}${String(month).padStart(2, '0')}`;
    months.push(monthStr);
    
    // 如果到达当前月份，停止生成
    if (month === currentMonthNum) {
      break;
    }
  }
  
  console.log(`生成的月份列表: ${months.join(", ")}`);
  return months;
}

/**
 * 更新KPI数据
 */
function updateKPIData(masterData, months) {
  // 计算各工序各月份的KPI
  const kpiData = calculateKPIData(masterData, months);
  
  // 批量写入KPI Summary sheet
  writeKPIData(kpiData, months);
}

/**
 * 计算KPI数据
 */
function calculateKPIData(masterData, months) {
  const kpiData = {};
  
  // 初始化数据结构
  Object.keys(PROCESS_CONFIG).forEach(process => {
    kpiData[process] = {};
    months.forEach(month => {
      kpiData[process][month] = { good: 0, bad: 0, total: 0 };
    });
  });
  
  console.log(`开始统计KPI数据，月份范围: ${months.join(", ")}`);
  console.log(`Master Data总条数: ${masterData.length}`);
  
  // 检查数据中的月份分布
  const monthDistribution = {};
  masterData.forEach(row => {
    const yearMonth = row.yearMonth;
    monthDistribution[yearMonth] = (monthDistribution[yearMonth] || 0) + 1;
  });
  console.log("Master Data中的月份分布:", monthDistribution);
  
  // 专门检查IM工序202509的数据
  const im202509Data = masterData.filter(row => 
    row.yearMonth === "202509" && row.keyProcess === "IM"
  );
  console.log(`IM工序202509总记录数: ${im202509Data.length}`);
  
  if (im202509Data.length > 0) {
    const goodCount = im202509Data.filter(row => row.performanceStatus === "好/Good").length;
    const badCount = im202509Data.filter(row => row.performanceStatus === "差/Bad").length;
    console.log(`IM工序202509 - 好记录数: ${goodCount}, 差记录数: ${badCount}`);
    
    // 显示前几条IM202509的数据
    console.log("IM工序202509前3条数据:");
    im202509Data.slice(0, 3).forEach((row, index) => {
      console.log(`第${index + 1}条: 年月=${row.yearMonth}, 工序=${row.keyProcess}, 子工序=${row.subProcess}, 绩效状态=${row.performanceStatus}`);
    });
  } else {
    console.log("IM工序202509没有数据");
  }
  
  // 统计各工序各月份的数据
  let processedCount = 0;
  masterData.forEach(row => {
    const { yearMonth, keyProcess, subProcess, performanceStatus } = row;
    
    if (!months.includes(yearMonth)) {
      // 显示被过滤的数据用于调试
      if (processedCount < 5) {
        console.log(`被过滤的数据: 年月=${yearMonth}, 工序=${keyProcess}, 子工序=${subProcess}, 绩效状态=${performanceStatus}`);
      }
      return;
    }
    
    processedCount++;
    
    // 统计主工序
    if (PROCESS_CONFIG[keyProcess]) {
      const processData = kpiData[keyProcess][yearMonth];
      if (performanceStatus === "好/Good") {
        processData.good++;
      } else if (performanceStatus === "差/Bad") {
        processData.bad++;
      }
      processData.total = processData.good + processData.bad;
    }
    
    // 统计TF子工序
    if (keyProcess === "TF" && PROCESS_CONFIG[subProcess]) {
      const processData = kpiData[subProcess][yearMonth];
      if (performanceStatus === "好/Good") {
        processData.good++;
      } else if (performanceStatus === "差/Bad") {
        processData.bad++;
      }
      processData.total = processData.good + processData.bad;
    }
  });
  
  console.log(`处理的数据条数: ${processedCount}`);
  
  // 输出统计结果用于调试
  Object.keys(kpiData).forEach(process => {
    months.forEach(month => {
      const data = kpiData[process][month];
      if (data.total > 0) {
        console.log(`${process} ${month}: 好=${data.good}, 差=${data.bad}, 总计=${data.total}`);
      }
    });
  });
  
  return kpiData;
}

/**
 * 写入KPI数据
 */
function writeKPIData(kpiData, months) {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const KPI_SUMMARY_SHEET = MAIN_SHEET.getSheetByName("KPI Summary");
  
  // 确定年份（从第一个月份获取）
  const year = months.length > 0 ? parseInt(months[0].substring(0, 4)) : new Date().getFullYear();
  
  // 获取目标值（在循环外调用一次，提高性能）
  const goalValues = getGoalValues(year);
  
  Object.keys(PROCESS_CONFIG).forEach(process => {
    // 根据年份获取对应的行号
    const row = year === 2026 ? PROCESS_CONFIG[process].row2026 : PROCESS_CONFIG[process].row2025;
    const goalValue = goalValues[process] || 0;
    
    months.forEach(month => {
      const col = MONTH_COLUMNS[month];
      if (!col) return;
      
      const data = kpiData[process][month];
      const kpiValue = data.total > 0 ? formatPercentage(data.good / data.total) : "-";
      
      const range = KPI_SUMMARY_SHEET.getRange(row, col);
      range.setValue(kpiValue);
      
      // 设置背景色（根据目标值判断）
      if (kpiValue !== "-") {
        const kpiNum = parseFloat(kpiValue.replace('%', ''));
        if (kpiNum >= goalValue) {
          range.setBackground('#90EE90'); // 深绿色
        } else {
          range.setBackground('#FFB6C1'); // 深红色
        }
      } else {
        range.setBackground(null); // 清除背景色
      }
      console.log(`写入 ${String.fromCharCode(64 + col)}${row}: ${kpiValue} (目标: ${goalValue}%)`);
    });
  });
  
  console.log(`更新KPI数据完成`);
}

/**
 * 格式化百分比（去掉末尾的0）
 */
function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) {
    return "0.0%";
  }
  
  // 将小数转换为百分比（乘以100）
  const percentage = value * 100;
  
  // 保留1位小数，然后去掉末尾的0
  const formatted = percentage.toFixed(1);
  const trimmed = formatted.replace(/\.0$/, '');
  
  return trimmed + "%";
}

/**
 * 获取各工序的目标值
 * @param {number} year - 年份（2025或2026）
 */
function getGoalValues(year) {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const KPI_SUMMARY_SHEET = MAIN_SHEET.getSheetByName("KPI Summary");
  
  const goalValues = {};
  
  Object.keys(PROCESS_CONFIG).forEach(process => {
    // 根据年份获取对应的行号
    const row = year === 2026 ? PROCESS_CONFIG[process].row2026 : PROCESS_CONFIG[process].row2025;
    const goalCell = KPI_SUMMARY_SHEET.getRange(row, 3); // C列是Goal列
    const goalValue = goalCell.getValue();
    
    // 解析目标值
    let goalNum = 0;
    if (typeof goalValue === 'string') {
      if (goalValue.includes('%')) {
        goalNum = parseFloat(goalValue.replace('%', ''));
      } else {
        goalNum = parseFloat(goalValue) || 0;
      }
    } else if (typeof goalValue === 'number') {
      // 如果目标值已经是数字，检查是否需要转换
      // 如果数值小于1，说明是小数格式（如0.617表示61.7%），需要乘以100
      if (goalValue < 1) {
        goalNum = goalValue * 100;
      } else {
        goalNum = goalValue;
      }
    } else {
      goalNum = 0;
    }
    
    goalValues[process] = goalNum;
    console.log(`${process}目标值: ${goalNum}% (原始值: ${goalValue}, 行: ${row}, 年份: ${year})`);
  });
  
  return goalValues;
}

/**
 * 更新年度累计数据（YTD）
 */
function updateYTDData(masterData) {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const KPI_SUMMARY_SHEET = MAIN_SHEET.getSheetByName("KPI Summary");
  
  // 获取当前年份
  const currentYear = new Date().getFullYear();
  const yearPrefix = currentYear.toString();
  const ytdKey = `${yearPrefix}YTD`;
  
  const ytdData = {};
  
  // 初始化YTD数据结构
  Object.keys(PROCESS_CONFIG).forEach(process => {
    ytdData[process] = { good: 0, bad: 0, total: 0 };
  });
  
  // 统计全年数据
  masterData.forEach(row => {
    const { yearMonth, keyProcess, subProcess, performanceStatus } = row;
    
    // 只统计当前年份的数据
    if (!yearMonth.startsWith(yearPrefix)) return;
    
    // 统计主工序
    if (PROCESS_CONFIG[keyProcess]) {
      const processData = ytdData[keyProcess];
      if (performanceStatus === "好/Good") {
        processData.good++;
      } else if (performanceStatus === "差/Bad") {
        processData.bad++;
      }
      processData.total = processData.good + processData.bad;
    }
    
    // 统计TF子工序
    if (keyProcess === "TF" && PROCESS_CONFIG[subProcess]) {
      const processData = ytdData[subProcess];
      if (performanceStatus === "好/Good") {
        processData.good++;
      } else if (performanceStatus === "差/Bad") {
        processData.bad++;
      }
      processData.total = processData.good + processData.bad;
    }
  });
  
  // 写入YTD数据
  Object.keys(PROCESS_CONFIG).forEach(process => {
    // 根据年份获取对应的行号
    const row = currentYear === 2026 ? PROCESS_CONFIG[process].row2026 : PROCESS_CONFIG[process].row2025;
    const col = MONTH_COLUMNS[ytdKey];
    if (!col) {
      console.log(`未找到${ytdKey}的列映射`);
      return;
    }
    
    const data = ytdData[process];
    const ytdValue = data.total > 0 ? formatPercentage(data.good / data.total) : "-";
    
    const range = KPI_SUMMARY_SHEET.getRange(row, col);
    range.setValue(ytdValue);
    
    // 设置背景色（根据目标值判断）
    const goalValues = getGoalValues(currentYear);
    const goalValue = goalValues[process] || 0;
    if (ytdValue !== "-") {
      const ytdNum = parseFloat(ytdValue.replace('%', ''));
      if (ytdNum >= goalValue) {
        range.setBackground('#90EE90'); // 深绿色
      } else {
        range.setBackground('#FFB6C1'); // 深红色
      }
    } else {
      range.setBackground(null); // 清除背景色
    }
    console.log(`写入YTD ${String.fromCharCode(64 + col)}${row}: ${ytdValue} (目标: ${goalValue}%, 好=${data.good}, 差=${data.bad}, 总计=${data.total})`);
  });
  
  console.log(`更新${ytdKey}数据完成`);
}
