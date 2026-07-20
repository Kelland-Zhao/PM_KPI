const sbnDataSetMs_Gs=saas.getSheetByName("MS_To_GS_设置");
const optionSourceExcel=sbnDataSetMs_Gs.getRange("A2").getDisplayValue();   //Excel文件来源
const fileName=sbnDataSetMs_Gs.getRange("B3").getDisplayValue();    //转换前后的文件名【需修改】
const targetGsDemand=sbnDataSetMs_Gs.getRange("A5").getDisplayValue();  //目标GS文件需求【需修改】
const targetGsId=sbnDataSetMs_Gs.getRange("B5").getDisplayValue();  //目标GS文件ID【需修改】
const sbnDataSetMs_GsLr=sbnDataSetMs_Gs.getLastRow();
const arrSetColA=sbnDataSetMs_Gs.getRange(2,1,sbnDataSetMs_GsLr-1,1).getDisplayValues().map(v=>{return v[0]});
const positionBufferCellRow=arrSetColA.indexOf("缓冲GS文件ID【程序控制】");
const bufferCellRow=positionBufferCellRow+2;
const arrSbnSourceData=sbnDataSetMs_Gs.getRange(2,5,sbnDataSetMs_GsLr-1,4).getDisplayValues().filter(v=>{return v[0]!=""});  //Mircro文件的数据信息
const arrSbnTargetData=sbnDataSetMs_Gs.getRange(2,9,sbnDataSetMs_GsLr-1,5).getDisplayValues().filter(v=>{return v[0]!=""});   //Google文件的数据信息
const arrSbnSourceName=arrSbnSourceData.map(v=>{return v[0]}).filter(v=>{return v!=""});          //Mircro文件的Sheet名
const arrSbnSourceStartRow=arrSbnSourceData.map(v=>{return v[1]}).filter(v=>{return v!=""});      //Mircro文件的Sheet的数据的开始行
const arrSbnSourceStartCol=arrSbnSourceData.map(v=>{return v[2]}).filter(v=>{return v!=""});      //Mircro文件的Sheet的数据的开始列
const arrSbnSourceEndCol=arrSbnSourceData.map(v=>{return v[3]}).filter(v=>{return v!=""});      //Mircro文件的Sheet的数据的结束列
const arrSbnTargetName=arrSbnTargetData.map(v=>{return v[0]}).filter(v=>{return v!=""});          //Google文件的Sheet名
const arrSbnTargetStartRow=arrSbnTargetData.map(v=>{return v[1]}).filter(v=>{return v!=""});      //Google文件的Sheet的数据的开始行
const arrSbnTargetStartCol=arrSbnTargetData.map(v=>{return v[2]}).filter(v=>{return v!=""});      //Google文件的Sheet的数据的开始列
const arrSbnTargetEndCol=arrSbnTargetData.map(v=>{return v[3]}).filter(v=>{return v!=""});      //Google文件的Sheet的数据的结束列
const arrSbnTargetFilterRow=arrSbnTargetData.map(v=>{return v[4]}).filter(v=>{return v!=""});      //Google文件的Sheet的数据的过虑行
const toMailInProcessInProcess=Session.getActiveUser().getEmail();;   //过程发送邮件

/*============获取记录方式：【数组】；优点：SheetId不变；缺点：数据量大时，速度慢，耗时长===========*/
function getRecord_Array(){
  let now=new Date();
  let nowDate=now.getDate();
  let nowHour=now.getHours();
  let nowMonth=now.getMonth();
  let currentYear=formatVariableAfterY(now);
  let lastMonthDateTime=new Date(now.getTime());
  let setCloseDate=8;   /**设置关账保存上个月的数据**/
  let setCloseHour=10;
  let setCloseMonth=1;
  /**设置关账保存上个月的数据**/
  if(nowMonth==setCloseMonth&&nowDate<=setCloseDate){    /**如果当前日期小于等于设置日期，则上个月份需要在当前月份减1**/
    lastMonthDateTime.setFullYear(now.getFullYear()-1);
    lastMonthDateTime.setDate(8);
  }
  console.log(formatVariableAfterY(lastMonthDateTime));
  let lastYear=formatVariableAfterY(lastMonthDateTime);
  console.log({"上个年份":lastYear,"当前年份":currentYear,"当前小时":nowHour});
  let arrReport=[["过程","开始时间→结束时间","耗时(分)"]];
  let timeStart=new Date().getTime();
  let timeStartProcess=timeStart
  let timeEndProcess=timeStart;
  let timeEnd=timeStart;
  let objProcessInfo={};
  let processDateTime=formatVariableAsDateHmsS(new Date());
  let sabiTarget;
  try{
    let fileIdExcel="";
    let fileExcelNum=0;
    if(optionSourceExcel=="源Excel路径ID【不可为空】"){
      let folderIdExcel=sbnDataSetMs_Gs.getRange("B2").getDisplayValue();
      let folderExcel=DriveApp.getFolderById(folderIdExcel);
      let fileExcel=folderExcel.getFilesByName(fileName);
      while(fileExcel.hasNext()){
        fileExcelNum+=1;
        fileIdExcel=fileExcel.next().getId();
      }
    }
    else if(optionSourceExcel=="源Excel文件ID【不可为空】"){
      fileIdExcel=sbnDataSetMs_Gs.getRange("B2").getDisplayValue();    //需要转换的Micro文件ID【需修改】
    }
    if(targetGsId!=""){
      sabiTarget=SpreadsheetApp.openById(targetGsId);
    }
    else{
      saas.toast("提示：目标GS文件ID不能为空","错误",-1);
      return;
    }
    /**删除所有数据**/
    // for(let i=0;i<arrSbnTargetName.length;i++){    //循环Sheet
    //   let ss=sabiTarget.getSheetByName(arrSbnTargetName[i]);   //定义当前工作簿中相应的Sheet
    //   if(ss){
    //     let ssMr=ss.getMaxRows();   //获取Sheet的最大行数
    //     let ssFilter=ss.getFilter();    //获取Sheet的筛选
    //     ss.setFrozenRows(0);    //取消Sheet冻结
    //     if(ssFilter){ssFilter.remove()}   //取消Sheet的筛选
    //     if(ssMr>1){ss.deleteRows(2, ssMr-1)}    //删除第一行外的所有行
    //   }
    // }
    if(fileExcelNum<2){
      if(bufferCellRow>5&&arrSbnSourceName.length==arrSbnTargetName.length&&arrSbnSourceStartRow.length==arrSbnTargetStartRow.length&&arrSbnSourceStartCol.length==arrSbnTargetStartCol.length&&arrSbnSourceEndCol.length==arrSbnTargetEndCol.length){
        sbnDataSetMs_Gs.getRange(bufferCellRow,2,1,2).clearContent();
        sbnDataSetMs_Gs.getRange(bufferCellRow+1,1,sbnDataSetMs_Gs.getMaxRows()-bufferCellRow,3).clearContent();
        processDateTime=formatVariableAsDateHmsS(new Date());
        console.log(processDateTime+"======>"+"正在转换……");
        saas.toast("正在转换……","提示",-1);
        objProcessInfo[processDateTime]="正在转换……";
        let folderIdTemp=checkBufferFolder("Buffer_ExcelToGs");   //检测根目录是否有缓存文件夹【自动】
        sbnDataSetMs_Gs.getRange("B4").setValue(folderIdTemp);   //检测到缓存文件夹ID写入B4单元格
        let arrConvertResult=microSoftToGoogle(fileName,fileIdExcel,folderIdTemp);   //调用MicroToGoogle模板程序，并返回文件ID
        if(arrConvertResult[0]=="OK"){
          let dataSourceId=arrConvertResult[1];
          timeEndProcess=new Date().getTime();
          sbnDataSetMs_Gs.getRange(bufferCellRow,2,1,2).setValues([['=hyperlink("https://docs.google.com/spreadsheets/d/'+dataSourceId+'","'+dataSourceId+'")',timeToYMDHMS(timeEndProcess)+"【Array方式创建】"]])
          arrReport.push(["Excel_To_Google",timeToYMDHMS(timeStartProcess)+'→'+timeToYMDHMS(timeEndProcess),calcDurationTime(timeStartProcess,timeEndProcess)]);
          let fileDataSource=SpreadsheetApp.openById(dataSourceId);   //定义转换后的工作簿
          for(let i=0;i<arrSbnTargetName.length;i++){    //循环Sheet
            try{
              processDateTime=formatVariableAsDateHmsS(new Date());
              console.log(processDateTime+"======>"+"正在处理Sheet:"+arrSbnTargetName[i]);
              saas.toast("正在处理Sheet:"+arrSbnTargetName[i],"提示",-1);
              objProcessInfo[processDateTime]="正在处理Sheet:"+arrSbnTargetName[i];
              timeStartProcess=new Date().getTime();
              let sbnSourceTemp=fileDataSource.getSheetByName(arrSbnSourceName[i]);    //定义转换后工作簿中的对应Sheet
              sbnSourceTempLr=sbnSourceTemp.getLastRow();
              console.log(arrSbnSourceName[i],arrSbnSourceStartRow[i],arrSbnSourceStartCol[i],sbnSourceTempLr-arrSbnSourceStartRow[i]+1,arrSbnSourceEndCol[i]-arrSbnSourceStartCol[i]+1);
              if(sbnSourceTempLr>=arrSbnSourceStartRow[i]){
                let arrDataSourceTemp=sbnSourceTemp.getRange(arrSbnSourceStartRow[i],arrSbnSourceStartCol[i],sbnSourceTemp.getLastRow()-arrSbnSourceStartRow[i]+1,arrSbnSourceEndCol[i]-arrSbnSourceStartCol[i]+1).getDisplayValues();   //将Sheet内容存入数组
                arrDataSourceTemp.forEach(v=>{v[1]=formatVariableAsDate(v[1]);v.push(formatVariableAfterYM(v[1]))});
                // console.log("arrDataSourceTemp",arrDataSourceTemp);
                arrDataSourceTemp=arrDataSourceTemp.sort((a,b)=>a[1].localeCompare(b[1]));
                // arrDataSourceTemp=arrDataSourceTemp.filter(v=>v[1]!="");    //设置某列不为空
                if(arrDataSourceTemp.length>1){   //如果内容不为空
                  let ss=sabiTarget.getSheetByName(arrSbnTargetName[i]);   //定义当前工作簿中相应的Sheet
                  if(ss){   //如果存在，则清除数据
                    let ssMr=ss.getMaxRows();   //获取Sheet的最大行数
                    let ssFilter=ss.getFilter();    //获取Sheet的筛选
                    ss.setFrozenRows(0);    //取消Sheet冻结
                    if(ssFilter){ssFilter.remove()}   //取消Sheet的筛选
                    if(ssMr>1){ss.deleteRows(2, ssMr-1)}    //删除第一行外的所有行
                    ss.insertRowAfter(1);
                  }
                  else{  //如果不存在，则插入一个
                    ss=sabiTarget.insertSheet(arrSbnTargetName[i],sabiTarget.getSheets().length);
                  }
                  /**如果当前日期等于设置日期，则汇总上个月份的机台运行时间，并写入CloseData表内**/

                  let sbnHistoryDataLr=sbnHistoryData.getLastRow();
                  let arrHistoryData=sbnHistoryData.getRange(2,10,sbnHistoryDataLr-1,1).getDisplayValues();
                  let arrHistoryDataYear=arrHistoryData.map(v=>v[0].slice(0,-2));
                  if(nowMonth==setCloseMonth&&nowDate==setCloseDate&&nowHour<setCloseHour&&nowHour>4){
                    if(arrHistoryDataYear.indexOf(lastYear.toString())==-1){
                      let arrDataSourceTempLast=arrDataSourceTemp.filter(v=>v[9].slice(0,-2)==lastYear);
                      sbnHistoryData.getRange(sbnHistoryDataLr+1,1,arrDataSourceTempLast.length,arrDataSourceTempLast[0].length).setValues(arrDataSourceTempLast);
                      arrDataSourceTemp=arrDataSourceTemp.filter(v=>v[9].slice(0,-2)==currentYear);
                      processDateTime=formatVariableAsDateHmsS(new Date());
                      objProcessInfo[processDateTime]="【"+lastYearMonth+"】MDT_PM_Before_After备份成功";
                    }
                    else{
                      processDateTime=formatVariableAsDateHmsS(new Date());
                      objProcessInfo[processDateTime]="【"+lastYearMonth+"】MDT_PM_Before_After已经有备份，请确认";
                    }
                  }
                  else{
                    arrDataSourceTemp=arrDataSourceTemp.filter(v=>arrHistoryDataYear.indexOf(v[9].slice(0,-2))==-1);
                  }
                  console.log("测试",arrDataSourceTemp);
                  ss.getRange(arrSbnTargetStartRow[i],arrSbnTargetStartCol[i],arrDataSourceTemp.length,arrDataSourceTemp[0].length).setValues(arrDataSourceTemp);   //将内容存入当前工作簿相应的Sheet中
                }
                else{
                  processDateTime=formatVariableAsDateHmsS(new Date());
                  objProcessInfo[processDateTime]="Sheet:【"+arrSbnTargetName[i]+"】数据处理结束，共"+(arrDataSourceTemp.length-1)+"条记录";
                  timeEndProcess=new Date().getTime();
                  arrReport.push(["Sheet:"+arrSbnTargetName[i],timeToYMDHMS(timeStartProcess)+'→'+timeToYMDHMS(timeEndProcess),calcDurationTime(timeStartProcess,timeEndProcess)]);
                }
              }
              else{
                processDateTime=formatVariableAsDateHmsS(new Date());
                objProcessInfo[processDateTime]="Sheet:【"+arrSbnTargetName[i]+"】数据处理结束，源表无数据";
                timeEndProcess=new Date().getTime();
                arrReport.push(["Sheet:"+arrSbnTargetName[i],timeToYMDHMS(timeStartProcess)+'→'+timeToYMDHMS(timeEndProcess),calcDurationTime(timeStartProcess,timeEndProcess)]);
              }
            }
            catch(e1){
              processDateTime=formatVariableAsDateHmsS(new Date());
              objProcessInfo[processDateTime]="Sheet:【"+arrSbnTargetName[i]+"】数据处理【失败："+e1.toString()+"】";
              timeEndProcess=new Date().getTime();
              arrReport.push(["Sheet:"+arrSbnTargetName[i],timeToYMDHMS(timeStartProcess)+'→'+timeToYMDHMS(timeEndProcess),calcDurationTime(timeStartProcess,timeEndProcess)+"【失败："+e1.toString()+"】"]);
            }
          }
          let sbnTargetTemp=sabiTarget.getSheetByName("【Temp】");
          if(sbnTargetTemp){
            sabiTarget.deleteSheet(sbnTargetTemp);
          }
          sbnDataSetMs_Gs.getRange(bufferCellRow+5,1,arrReport.length,arrReport[0].length).setValues(arrReport);
          timeEnd=timeEndProcess;
          processDateTime=formatVariableAsDateHmsS(new Date());
          console.log(processDateTime+"======>"+"耗用时间："+calcDurationTime(timeStart,timeEnd)+"分钟");
          saas.toast("耗用时间："+calcDurationTime(timeStart,timeEnd)+"分钟","提示",-1);
          objProcessInfo[processDateTime]="耗用时间："+calcDurationTime(timeStart,timeEnd)+"分钟";
        }
        else{
          timeEnd=new Date().getTime();
          arrReport.push(["提示",timeToYMDHMS(timeStart)+'→'+timeToYMDHMS(timeEnd),calcDurationTime(timeStart,timeEnd)+"【转换遇到问题："+arrConvertResult[1]+"】"]);
          sbnDataSetMs_Gs.getRange(bufferCellRow+5,1,arrReport.length,arrReport[0].length).setValues(arrReport);
          processDateTime=formatVariableAsDateHmsS(new Date());
          console.log(processDateTime+"======>"+"【转换遇到问题："+arrConvertResult[1]+"】");
          saas.toast("【转换遇到问题："+arrConvertResult[1]+"】","提示",-1);
          objProcessInfo[processDateTime]="【转换遇到问题："+arrConvertResult[1]+"】";
        }
      }
      else{
        timeEnd=new Date().getTime();
        arrReport.push(["提示",timeToYMDHMS(timeStart)+'→'+timeToYMDHMS(timeEnd),calcDurationTime(timeStart,timeEnd)+"【设置有问题，需确认】"]);
        sbnDataSetMs_Gs.getRange(bufferCellRow+5,1,arrReport.length,arrReport[0].length).setValues(arrReport);
        processDateTime=formatVariableAsDateHmsS(new Date());
        console.log(processDateTime+"======>"+"设置有问题，请检查");
        saas.toast("设置有问题，请检查","提示",-1);
        objProcessInfo[processDateTime]="设置有问题，请检查";
      }
    }
    else{
      saas.toast("提示：有"+fileExcelNum+"个相同的文件名");
      processDateTime=formatVariableAsDateHmsS(new Date());
      console.log(processDateTime+"======>"+"有"+fileExcelNum+"个相同的文件名");
      saas.toast("有"+fileExcelNum+"个相同的文件名","提示",-1);
      objProcessInfo[processDateTime]="有"+fileExcelNum+"个相同的文件名";
    }
  }
  catch(e){
    timeEnd=new Date().getTime();
    arrReport.push(["提示",timeToYMDHMS(timeStart)+'→'+timeToYMDHMS(timeEnd),calcDurationTime(timeStart,timeEnd)+"【失败："+e.toString()+"】"]);
    sbnDataSetMs_Gs.getRange(bufferCellRow+5,1,arrReport.length,arrReport[0].length).setValues(arrReport);
    processDateTime=formatVariableAsDateHmsS(new Date());
    console.log(processDateTime+"======>"+"失败："+e.toString());
    saas.toast("失败："+toString(),"提示",-1);
    objProcessInfo[processDateTime]="失败："+e.toString();
  }
  sendMessage(objProcessInfo,sabiTarget);
}