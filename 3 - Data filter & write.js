/**
 * 保养数据整合推送 - 数据筛选与写入模块
 * 功能：从PM Data、Master Data_Excel、TF Machine Type获取数据，整合后写入Master Data
 */

// 主数据源配置
const MAIN_SHEET_ID = "1C7z16Ww22dfGxeqKRrBw27J-zmXXStAt2xoEYwL-V24";

/**
 * 主函数：执行数据筛选与写入
 */
function executeDataFilterAndWrite() {
  

  try {
    // 1. 获取PM Data并筛选
    const pmData = getFilteredPMData();
    console.log(`筛选后PM Data记录数: ${pmData.length}`);
    
    // 2. 生成PM Data序列号
    const pmSerialNumbers = generatePMSerialNumbers(pmData);
    console.log(`生成的PM序列号数量: ${pmSerialNumbers.length}`);
    
    // 3. 获取Master Data_Excel数据
    const masterExcelData = getMasterExcelData();
    console.log(`Master Data_Excel总记录数: ${masterExcelData.length - 1}`);
    
    // 4. 生成Master Data_Excel序列号并筛选匹配数据
    const matchedMasterData = filterMatchedMasterData(masterExcelData, pmSerialNumbers);
    console.log(`匹配的Master Data_Excel记录数: ${matchedMasterData.length}`);
    
    // 5. 获取TF Machine Type数据
    const tfMachineData = getTFMachineData();
    
    // 6. 整合数据并写入Master Data
    const integratedData = integrateData(matchedMasterData, pmData, tfMachineData);
    writeToMasterData(integratedData);
    
    console.log("数据筛选与写入完成");
    
  } catch (error) {
    console.error("执行数据筛选与写入时出错:", error);
    throw error;
  }
}

/**
 * 获取并筛选PM Data
 */
function getFilteredPMData() {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const PM_DATA_SHEET = MAIN_SHEET.getSheetByName("PM Data");
  const data = PM_DATA_SHEET.getDataRange().getValues();
  const headers = data[0];
  
  // 获取列索引
  const categoryIndex = headers.indexOf("类别");
  const statusIndex = headers.indexOf("状态");
  const startDateIndex = headers.indexOf("开始日期");
  const aemIndex = headers.indexOf("AEM#");
  
  // 筛选：类别含"PM"且状态不含"取消"
  return data.slice(1).filter(row => 
    row[categoryIndex] && row[categoryIndex].toString().includes("PM") &&
    (!row[statusIndex] || !row[statusIndex].toString().includes("取消"))
  );
}

/**
 * 生成PM Data序列号
 */
function generatePMSerialNumbers(pmData) {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const PM_DATA_SHEET = MAIN_SHEET.getSheetByName("PM Data");
  const headers = PM_DATA_SHEET.getRange("A1:Z1").getValues()[0];
  const startDateIndex = headers.indexOf("开始日期");
  const aemIndex = headers.indexOf("AEM#");
  
  console.log(`开始日期列索引: ${startDateIndex}, AEM#列索引: ${aemIndex}`);
  
  const serialNumbers = pmData.map(row => {
    const startDate = row[startDateIndex];
    const aem = row[aemIndex];
    const serialNumber = formatDate(startDate) + aem;
    return serialNumber;
  });
  
  console.log(`前5个PM序列号: ${serialNumbers.slice(0, 5)}`);
  return serialNumbers;
}

/**
 * 获取Master Data_Excel数据
 */
function getMasterExcelData() {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const MASTER_EXCEL_SHEET = MAIN_SHEET.getSheetByName("Master Data_Excel");
  return MASTER_EXCEL_SHEET.getDataRange().getValues();
}

/**
 * 筛选匹配的Master Data_Excel数据
 */
function filterMatchedMasterData(masterExcelData, pmSerialNumbers) {
  const headers = masterExcelData[0];
  const pmDateIndex = headers.indexOf("PM_Date");
  const workcenterIndex = headers.indexOf("Workcenter");
  
  console.log(`Master Data_Excel - PM_Date列索引: ${pmDateIndex}, Workcenter列索引: ${workcenterIndex}`);
  console.log(`PM序列号总数: ${pmSerialNumbers.length}`);
  console.log(`前5个PM序列号: ${pmSerialNumbers.slice(0, 5)}`);
  
  // 生成Master Data_Excel序列号
  const masterSerialNumbers = masterExcelData.slice(1).map(row => {
    const serialNumber = formatDate(row[pmDateIndex]) + row[workcenterIndex];
    return serialNumber;
  });
  
  console.log(`Master Data_Excel序列号总数: ${masterSerialNumbers.length}`);
  console.log(`前5个Master序列号: ${masterSerialNumbers.slice(0, 5)}`);
  
  // 筛选匹配的数据
  const matchedData = [];
  masterExcelData.slice(1).forEach((row, index) => {
    if (pmSerialNumbers.includes(masterSerialNumbers[index])) {
      matchedData.push(row);
      console.log(`匹配到数据: ${masterSerialNumbers[index]}`);
    }
  });
  
  return matchedData;
}

/**
 * 获取TF Machine Type数据
 */
function getTFMachineData() {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const TF_MACHINE_SHEET = MAIN_SHEET.getSheetByName("TF Machine Type");
  const data = TF_MACHINE_SHEET.getDataRange().getValues();
  const headers = data[0];
  const workcenterIndex = headers.indexOf("Workcenter");
  const machineTypeIndex = headers.indexOf("Machine Type_修正");
  
  // 创建Workcenter到Machine Type_修正的映射
  const mapping = {};
  data.slice(1).forEach(row => {
    if (row[workcenterIndex] && row[machineTypeIndex]) {
      mapping[row[workcenterIndex]] = row[machineTypeIndex];
    }
  });
  
  return mapping;
}

/**
 * 整合数据
 */
function integrateData(masterData, pmData, tfMachineMapping) {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);
  const MASTER_EXCEL_SHEET = MAIN_SHEET.getSheetByName("Master Data_Excel");
  
  const integratedData = [];
  
  // 调试：输出表头信息
  const headers = MASTER_EXCEL_SHEET.getRange("A1:Z1").getValues()[0];
  console.log("Master Data_Excel表头:", headers);
  
  masterData.forEach((masterRow, index) => {
    const pmDateIndex = headers.indexOf("PM_Date");
    const workcenterIndex = headers.indexOf("Workcenter");
    const keyProcessIndex = headers.indexOf("KeyProcess");
    const yearMonthIndex = headers.indexOf("YearMonth");
    
    // 调试：输出PM_Date相关信息（只显示前3条）
    if (index < 3) {
      console.log(`=== 第${index + 1}条数据 ===`);
      console.log(`PM_Date列索引: ${pmDateIndex}`);
      console.log(`原始PM_Date值: ${masterRow[pmDateIndex]} (类型: ${typeof masterRow[pmDateIndex]})`);
      console.log(`格式化后PM_Date值: ${formatDate(masterRow[pmDateIndex])}`);
      console.log(`Workcenter值: ${masterRow[workcenterIndex]}`);
      console.log(`完整数据行:`, masterRow);
    }
    
    // 生成序列号
    const serialNumber = formatDate(masterRow[pmDateIndex]) + masterRow[workcenterIndex];
    
    // 计算生产状态
    const afterPMTime = masterRow[headers.indexOf("Production_AvailableTime_AFTER PM")];
    const productionStatus = afterPMTime < 144 ? "未达144" : "生产";
    
    // 调试：检查特定序列号的数据
    if (serialNumber === "2025-09-08H2FCS904") {
      console.log(`=== 调试序列号 ${serialNumber} ===`);
      console.log(`Master Data_Excel中的Production_AvailableTime_AFTER PM: ${afterPMTime} (类型: ${typeof afterPMTime})`);
      console.log(`计算条件: ${afterPMTime} < 144 = ${afterPMTime < 144}`);
      console.log(`计算结果: ${productionStatus}`);
      console.log(`完整masterRow数据:`, masterRow);
    }
    
    // 计算绩效状态（需要解析百分数格式）
    const updtBeforeRaw = masterRow[headers.indexOf("UPDT_BEFORE PM")];
    const updtAfterRaw = masterRow[headers.indexOf("UPDT_AFTER PM")];
    const updtBeforeNum = parsePercentage(updtBeforeRaw);
    const updtAfterNum = parsePercentage(updtAfterRaw);
    const performanceStatus = updtAfterNum <= updtBeforeNum ? "好/Good" : "差/Bad";
    
    // 获取子工序
    const subProcess = tfMachineMapping[masterRow[workcenterIndex]] || masterRow[keyProcessIndex];
    
    // 格式化百分数字段
    const auBefore = formatPercentage(masterRow[headers.indexOf("AU_BEFORE PM")]);
    const auAfter = formatPercentage(masterRow[headers.indexOf("AU_AFTER PM")]);
    const updtBefore = formatPercentage(masterRow[headers.indexOf("UPDT_BEFORE PM")]);
    const updtAfter = formatPercentage(masterRow[headers.indexOf("UPDT_AFTER PM")]);
    
    // 构建数据行
    const row = [
      serialNumber,                                    // 序列号/Serial No.
      masterRow[keyProcessIndex],                      // 工序/KeyProcess
      formatDate(masterRow[pmDateIndex]),              // 保养日期/PM_Date
      masterRow[workcenterIndex],                      // 机台号/Workcenter
      masterRow[headers.indexOf("Production_AvailableTime_BEFORE PM")],  // Production_AvailableTime_BEFORE PM
      masterRow[headers.indexOf("Production_AvailableTime_AFTER PM")],   // Production_AvailableTime_AFTER PM
      auBefore,                                        // AU_BEFORE PM (百分数格式)
      auAfter,                                         // AU_AFTER PM (百分数格式)
      updtBefore,                                      // UPDT_BEFORE PM (百分数格式)
      updtAfter,                                       // UPDT_AFTER PM (百分数格式)
      masterRow[yearMonthIndex],                       // 保养月份/YearMonth
      subProcess,                                      // 子工序/SubProcess
      productionStatus,                                // 生产状态/Production Status
      performanceStatus,                               // 绩效状态/Performance Status
      ""                                               // 原因/Reason
    ];
    
    integratedData.push(row);
  });
  
  return integratedData;
}

/**
 * 写入Master Data
 */
function writeToMasterData(integratedData) {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const MASTER_DATA_SHEET = MAIN_SHEET.getSheetByName("Master Data");
  if (integratedData.length === 0) {
    console.log("没有数据需要写入");
    return;
  }
  
  // 获取现有数据
  const existingData = MASTER_DATA_SHEET.getDataRange().getValues();
  const existingSerialNumbers = new Set(existingData.slice(1).map(row => row[0]));
  
  console.log(`现有数据中的序列号总数: ${existingSerialNumbers.size}`);
  console.log(`前5个现有序列号:`, Array.from(existingSerialNumbers).slice(0, 5));
  
  // 分离新数据和更新数据
  const newData = [];
  const updateData = [];
  
  // 检查Master Data中现有数据的生产状态
  existingData.slice(1).forEach((existingRow, index) => {
    const serialNumber = existingRow[0];
    const existingProductionStatus = existingRow[12]; // 生产状态列
    
    console.log(`检查现有数据 - 序列号: ${serialNumber}, 生产状态: ${existingProductionStatus}`);
    
    // 如果现有数据的生产状态是"未达144"，则需要更新
    if (existingProductionStatus === "未达144") {
      // 从integratedData中找到对应的最新数据
      const latestData = integratedData.find(row => row[0] === serialNumber);
      if (latestData) {
        updateData.push({
          serialNumber: serialNumber,
          rowIndex: index + 2, // 转换为1基索引，+1因为跳过了表头
          data: latestData
        });
        console.log(`序列号 ${serialNumber} 需要更新，从Master Data_Excel获取最新数据`);
      } else {
        console.log(`序列号 ${serialNumber} 在Master Data_Excel中未找到对应数据`);
      }
    }
  });
  
  // 处理新数据（在Master Data中不存在的序列号）
  integratedData.forEach(row => {
    const serialNumber = row[0];
    if (!existingSerialNumbers.has(serialNumber)) {
      newData.push(row);
      console.log(`序列号 ${serialNumber} 为新数据`);
    }
  });
  
  // 写入新数据
  if (newData.length > 0) {
    // 调试：显示要写入的数据格式
    console.log("=== 要写入的新数据 ===");
    newData.slice(0, 3).forEach((row, index) => {
      console.log(`第${index + 1}条数据:`, {
        serialNumber: row[0],
        keyProcess: row[1],
        pmDate: row[2],
        workcenter: row[3],
        yearMonth: row[10]
      });
    });
    
    MASTER_DATA_SHEET.getRange(MASTER_DATA_SHEET.getLastRow() + 1, 1, newData.length, 15).setValues(newData);
    console.log(`写入新数据: ${newData.length}条`);
  }
  
  // 更新现有数据
  if (updateData.length > 0) {
    updateData.forEach(updateItem => {
      const serialNumber = updateItem.serialNumber;
      const rowIndex = updateItem.rowIndex;
      const data = updateItem.data;
      
      console.log(`更新序列号 ${serialNumber}，行号: ${rowIndex}`);
      // 更新指定字段（列2-14，对应索引1-13）
      MASTER_DATA_SHEET.getRange(rowIndex, 2, 1, 13).setValues([data.slice(1, 14)]);
    });
    console.log(`更新数据: ${updateData.length}条`);
  }
  
  // 设置绩效状态背景色
  setPerformanceStatusColors();
}

/**
 * 设置绩效状态背景色
 */
function setPerformanceStatusColors() {
  const MAIN_SHEET = SpreadsheetApp.openById(MAIN_SHEET_ID);

// Sheet引用
const MASTER_DATA_SHEET = MAIN_SHEET.getSheetByName("Master Data");
  const data = MASTER_DATA_SHEET.getDataRange().getValues();
  const performanceStatusIndex = 13; // 绩效状态列索引
  
  data.slice(1).forEach((row, index) => {
    const rowNum = index + 2;
    const performanceStatus = row[performanceStatusIndex];
    
    if (performanceStatus === "好/Good") {
      MASTER_DATA_SHEET.getRange(rowNum, performanceStatusIndex + 1).setBackground("#90EE90"); // 浅绿色
    } else if (performanceStatus === "差/Bad") {
      MASTER_DATA_SHEET.getRange(rowNum, performanceStatusIndex + 1).setBackground("#FFB6C1"); // 浅红色
    }
  });
}

/**
 * 格式化日期为YYYY-MM-DD格式
 */
function formatDate(date) {
  if (!date) return "";
  
  // 如果已经是YYYY-MM-DD格式，直接返回
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  const d = new Date(date);
  
  // 检查日期是否有效
  if (isNaN(d.getTime())) {
    console.log(`无效的日期格式: ${date}`);
    return "";
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化百分数
 */
function formatPercentage(value) {
  if (!value) return "";
  
  // 如果已经是百分数格式（包含%），直接返回
  if (value.toString().includes('%')) {
    return value.toString();
  }
  
  // 如果是数字，转换为百分数格式
  const num = parseFloat(value);
  if (!isNaN(num)) {
    // 如果数值小于1，说明是小数格式，需要乘以100
    if (num < 1) {
      return `${(num * 100).toFixed(1)}%`;
    } else {
      // 如果数值大于等于1，说明已经是百分数格式的数值
      return `${num.toFixed(1)}%`;
    }
  }
  
  return value.toString();
}

/**
 * 解析百分数为数字
 */
function parsePercentage(value) {
  if (!value) return 0;
  
  const str = value.toString();
  
  // 如果包含%，去掉%符号并转换为数字
  if (str.includes('%')) {
    return parseFloat(str.replace('%', ''));
  }
  
  // 直接转换为数字
  const num = parseFloat(str);
  
  // 如果数值小于1，说明是小数格式，需要乘以100
  if (num < 1) {
    return num * 100;
  }
  
  return num;
}
