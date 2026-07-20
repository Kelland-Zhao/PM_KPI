/**
 * 从外部Google表格复制D列和G列的数据到指定目标表格的"TF Machine Type"工作表。
 * 1. 从ID为"1Wm_-6j60ZD8KrUMa1gjzuUlRzky1zmc3hrX_u0ZFxT0"，的一个名为"1. Active Machine"的sheet中获取D列和G列第三行开始的数据；
 * 2. 将获取的数据粘贴到目标Spreadsheet (ID: 1C7z16Ww22dfGxeqKRrBw27J-zmXXStAt2xoEYwL-V24)中名为"TF Machine Type"的第二行开始中。
 * 3. 对于获取到的G列中的数据进行判断，并生成新的机型，并写入到"TF Machine Type"的C列中。
 * - 所有包含"AFT"或"PTT"字段的，新机型为"AFT & USW"。
 * - 所有包含"ZAH"或"ZOR字段的，新机型为"Zar"。
 * - 所有包含"HSL"或"BOU"字段的，新机型为"HSL & Bou"。
 */
function copyMachineDataToTFMachineTypeSheet() {
  const SOURCE_SPREADSHEET_ID = "1Wm_-6j60ZD8KrUMa1gjzuUlRzky1zmc3hrX_u0ZFxT0";
  const SOURCE_SHEET_NAME = "1. Active Machine";
  const DESTINATION_SPREADSHEET_ID = "1C7z16Ww22dfGxeqKRrBw27J-zmXXStAt2xoEYwL-V24";
  const DESTINATION_SHEET_NAME = "TF Machine Type";

  // 获取目标电子表格
  const targetSpreadsheet = SpreadsheetApp.openById(DESTINATION_SPREADSHEET_ID);

  try {
    // 获取源电子表格
    const sourceSpreadsheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID); 
    // 获取源工作表
    const sourceSheet = sourceSpreadsheet.getSheetByName(SOURCE_SHEET_NAME);
    // 获取目标工作表
    const destinationSheet = targetSpreadsheet.getSheetByName(DESTINATION_SHEET_NAME);

    // 检查工作表是否存在
    if (!sourceSheet) {
      const ui = SpreadsheetApp.getUi();
      ui.alert("错误", `源工作表 '${SOURCE_SHEET_NAME}' 未找到。请检查名称是否正确。`, ui.ButtonSet.OK);
      Logger.log(`Error: Source sheet '${SOURCE_SHEET_NAME}' not found.`);
      return;
    }
    if (!destinationSheet) {
      const ui = SpreadsheetApp.getUi();
      ui.alert("错误", `目标工作表 '${DESTINATION_SHEET_NAME}' 在目标电子表格中未找到。请检查名称是否正确。`, ui.ButtonSet.OK);
      Logger.log(`Error: Destination sheet '${DESTINATION_SHEET_NAME}' not found in target spreadsheet.`);
      return;
    }

    // 获取源数据范围 (D列和G列，从第三行开始)
    const sourceLastRow = sourceSheet.getLastRow();
    if (sourceLastRow < 3) {
      Logger.log(`Source sheet '${SOURCE_SHEET_NAME}' does not have enough data rows (at least 3 rows).`);
      return;
    }

    // 读取D列和G列的数据
    // D列是第4列，G列是第7列
    // 为了获取G列的值来判断新机型，我们读取D到G列的范围
    const sourceDataRange = sourceSheet.getRange(3, 4, sourceLastRow - 2, 4); // 从第3行开始，读取D到G列，共4列
    const sourceValues = sourceDataRange.getValues();

    // 准备要粘贴的数据 (D列, G列, 和新的C列机型)
    const dataToPaste = [];
    sourceValues.forEach(row => {
      const dColumnValue = row[0]; // D列的值 (索引0，因为读取的是D到G的范围)
      const gColumnValue = String(row[3] || ""); // G列的值 (索引3，因为读取的是D到G的范围)，确保是字符串

      let newMachineType = "";

      // 判断并生成新的机型
      if (gColumnValue.includes("AFT") || gColumnValue.includes("PTT")) {
        newMachineType = "AFT & USW";
      } else if (gColumnValue.includes("ZAH") || gColumnValue.includes("ZOR")) {
        newMachineType = "Zar";
      } else if (gColumnValue.includes("HSL") || gColumnValue.includes("BOU")) {
        newMachineType = "HSL & Bou";
      }
      // 如果不符合以上任何条件，则 newMachineType 保持为空字符串

      dataToPaste.push([dColumnValue, gColumnValue, newMachineType]); // D列到A列，G列到B列，新机型到C列
    });

    // 清空目标工作表从第二行开始的所有内容，以确保每次运行都是干净的粘贴
    const destLastRow = destinationSheet.getLastRow();
    if (destLastRow >= 2) {
      destinationSheet.getRange(2, 1, destLastRow - 1, destinationSheet.getLastColumn()).clearContent();
      Logger.log(`Cleared existing content in '${DESTINATION_SHEET_NAME}' of target spreadsheet.`);
    }

    // 粘贴数据到目标工作表 (从第二行开始，A列, B列, C列)
    if (dataToPaste.length > 0) {
      // dataToPaste[0].length 现在是3，因为我们有D, G, 和 newMachineType
      destinationSheet.getRange(2, 1, dataToPaste.length, dataToPaste[0].length).setValues(dataToPaste);
      Logger.log(`Successfully copied ${dataToPaste.length} rows from '${SOURCE_SHEET_NAME}' to '${DESTINATION_SHEET_NAME}' in target spreadsheet.`);
    } else {
      Logger.log("No data found to copy from source sheet.");
    }

  } catch (e) {
    const ui = SpreadsheetApp.getUi();
    ui.alert("错误", `复制数据时发生错误：${e.message}`, ui.ButtonSet.OK);
    Logger.log(`Error in copyMachineDataToTFMachineTypeSheet: ${e.message}`);
  }
}