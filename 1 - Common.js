/******【定时执行】模块用******/
/***计算当前日期在当月第几周***/
function getWeekInMonth(variable){
  let result=1;
  if(variable){
    let date = new Date(variable);
    let w = date.getDay();
    let d = date.getDate();
    result=Math.ceil((d + 6 - w) / 7)
  }
  return result;
}

/***计算当前时间前20分钟时间***/
function newTimeBefore(nowTime){
  let newTime="";
  if(nowTime){
    newTime=nowTime-20*60*1000;
  }
  return newTime;
}

/***计算当前时间后10分钟时间***/
function newTimeAfter(nowTime){
  let newTime="";
  if(nowTime){
    newTime=nowTime+10*60*1000;
  }
  return newTime;
}

/***时间转换成日期时间***/
const regexDateTime1 = /^[0-9\-: ]+$/;
const regexDateTime2 = /^[0-9\/: ]+$/;

function formatVariableAsDateHmsS(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    result=Utilities.formatDate(new Date(variable),currentTimeZone,"yyyy-MM-dd HH:mm:ss:SSS");
  }
  return result;
}

function formatVariableAsDateHms(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    result=Utilities.formatDate(new Date(variable),currentTimeZone,"yyyy-MM-dd HH:mm:ss");
  }
  return result;
}

/***时间转换成日期时间(分钟)***/
function formatVariableAsDateHm(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    result=Utilities.formatDate(new Date(variable),currentTimeZone,"yyyy-MM-dd HH:mm");
  }
  return result;
}

/***时间转换成日期***/
function formatVariableAsDate(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    result=Utilities.formatDate(new Date(variable),currentTimeZone,"yyyy-MM-dd");
  }
  return result;
}

/***时间转换成日期***/
function formatVariableAsYM(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    result=Utilities.formatDate(new Date(variable),currentTimeZone,"yyyyMM");
  }
  return result;
}

/***时间转换成日期***/
function formatVariableAfterY(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    let variableDateTime=new Date(variable);
    let variableTime=variableDateTime.getTime();
    let variableDate=variableDateTime.getDate();
    if(variableDate>20){
      result=Utilities.formatDate(new Date(variableTime+11*24*3600*1000),currentTimeZone,"yyyy");
    }
    else{
      result=Utilities.formatDate(variableDateTime,currentTimeZone,"yyyy");
    }
  }
  return result;
}

function formatVariableAfterYM(variable){
  let result="";
  if(variable){   //&&(regexDateTime1.test(variable)||regexDateTime2.test(variable))
    let variableDateTime=new Date(variable);
    let variableTime=variableDateTime.getTime();
    let variableDate=variableDateTime.getDate();
    if(variableDate>20){
      result=Utilities.formatDate(new Date(variableTime+11*24*3600*1000),currentTimeZone,"yyyyMM");
    }
    else{
      result=Utilities.formatDate(variableDateTime,currentTimeZone,"yyyyMM");
    }
  }
  return result;
}
/*******【获取并发送邮件内容】模块用*******/
/***数组中插入行数***/
function addRowRemarkToArr(arrBody,startRow){
  for(let i=0;i<arrBody.length;i++){
    arrBody[i].push(i+startRow)
  }
  return arrBody
}

/***根据设置条件筛选数组***/
function filterEffData(arrBody,filterJson){
  let lastVal="";
  let arrTemp=[];
  if(filterJson){
    filterJson=JSON.parse(filterJson.replace(/'/g,'"'));
    for(let i in filterJson){
      if(filterJson[i]=="不为空"){
        arrBody=arrBody.filter(v=>{return v[i-1]!=""});
      }
      else if(filterJson[i]=="为空"){
        arrBody=arrBody.filter(v=>{return v[i-1]==""});
      }
      else if(filterJson[i]=="LastRowVal"){
        arrTemp=arrBody.filter(v=>{return v[i-1]!=""});
        if(arrTemp.length>0){
          lastVal=arrTemp[arrTemp.length-1][i-1];
          arrBody=arrBody.filter(v=>{return v[i-1]==lastVal});
        }
      }
      else{
        arrBody=arrBody.filter(v=>{return v[i-1]==filterJson[i]});
      }
    }
  }
  return arrBody;
}

/**===========JSON文本转换为数组===========**/
function jsonTxtToArr(jsonTxt){
  let arr=[-1];
  if(jsonTxt){
    arr=JSON.parse(jsonTxt);
  }
  return arr;
}

/***数组转换成HTML_TABLE***/
function generalHtmltableFormat(arrData,arrBackgrounds,widths,scale,hideCols) {
  let htmltable="<table border='1' style='table-layout:fixed;border-collapse:collapse;font-size:12px;margin-left:50px;width:"+scale+"%;'>";
  for(let i=0;i<arrData.length;i++){
    htmltable += "<tr>"
    for(let j=0;j<arrData[i].length-1;j++){
      if(hideCols.indexOf((j+1))==-1){
        htmltable += "<td style='width:"+widths[j]+"%;"+
                      ";text-align:center;overflow-wrap:anywhere;word-break:break-all"+
                      ";background:" + arrBackgrounds[i][j] + 
                      "'>"+
                      arrData[i][j].toString().replace(/\n/g,"<br>") + 
                      "</td>";
      }
      else{
        htmltable += "<td style='width:"+widths[j]+"%;"+
                      ";text-align:center;overflow-wrap:anywhere;word-break:break-all;display:none"+
                      ";background:" + arrBackgrounds[i][j] + 
                      "'>"+
                      arrData[i][j].toString().replace(/\n/g,"<br>") + 
                      "</td>";
      }
    }
    htmltable += "</tr>";
  }
  htmltable += "</table>"
  return htmltable;
}

function getHeadTempWidth(sbnTemp,startCol,endCol){
  let arrWidthTemp=[];
  let widthTotal=0;
  let widthTemp=0
  for(var i=0;i<=endCol-startCol;i++){
    widthTemp=sbnTemp.getColumnWidth(i+startCol);
    arrWidthTemp.push(widthTemp);
    widthTotal=widthTotal+widthTemp;
  }
  let arrHeadTempWidth=[];
  for(var j=0;j<arrWidthTemp.length;j++){
    arrHeadTempWidth.push(arrWidthTemp[j]/widthTotal*100);
  }
  return arrHeadTempWidth;
}

/***发送含HTMLTXT的邮件***/
function mailHtmlTxt(toMail,title,call,arrMailBodyTitle,arrMailBodyData,ccMail,fromMail,emailImages,arrAttachment){
  let html_txt='<div><p style="font-size:14px;color:black">'+
               call+//【称呼】
               '</p>';//+
  for(let i=0;i<arrMailBodyTitle.length;i++){
    if(arrMailBodyData[i].toString().length<2){
      html_txt=html_txt+'<div><p style="font-size:12px;color:blue;margin-left:15px"><b>'+
                arrMailBodyTitle[i].toString().replace(/\n/g,"<br>")+   //【描述1】         
                '</b></p>'+
                '<div><p style="font-size:12px;color:black;margin-left:30px">'+
                arrMailBodyData[i]+    //【描述2】
                '</p>'
    }
    else{
      html_txt=html_txt+'<div><p style="font-size:12px;color:magenta;margin-left:15px"><b>'+
                arrMailBodyTitle[i].toString().replace(/\n/g,"<br>")+   //【描述1】         
                '</b></p>'+
                '<div><p style="font-size:12px;color:black;margin-left:30px">'+
                arrMailBodyData[i]+    //【描述2】
                '</p>'
    }
  }
  let fromMails=GmailApp.getAliases();
  let position=fromMails.indexOf(fromMail);
  if(position!=-1){
    if(Object.keys(emailImages).length>0){
      MailApp.sendEmail(toMail, title,'' ,{htmlBody: html_txt,inlineImages:emailImages,attachments:arrAttachment,cc:ccMail,name:"GoogleScriptAutoSend"}); 
    }
    else{
      GmailApp.sendEmail(toMail, title,'' ,{htmlBody: html_txt,inlineImages:emailImages,attachments:arrAttachment,cc:ccMail,from:fromMail}); 
    }
  }
  else{
    if(Object.keys(emailImages).length>0){
      MailApp.sendEmail(toMail, title,'' ,{htmlBody: html_txt,inlineImages:emailImages,attachments:arrAttachment,cc:ccMail,name:"GoogleScriptAutoSend"}); 
    }
    else{
      GmailApp.sendEmail(toMail, title,'' ,{htmlBody: html_txt,inlineImages:emailImages,attachments:arrAttachment,cc:ccMail}); 
    }
  }  
}

/**============发送数据处理信息============**/
function sendMessage(obj,spreadsheet) {
  let arrData=[];
  for(let i in obj){
    arrData.push(i+"==>"+obj[i]);
  }
  let strData=arrData.join("\n\n");
  strData="脚本运行："+scriptRunOwner+"\n\n"+strData;
  let payload = JSON.stringify({
    "cards": [{
      "header": {
        "title": "Data Processing Report【"+spreadsheet.getName()+"】",
        "imageUrl": "https://www.gstatic.com/images/icons/material/system/2x/shopping_bag_gm_blue_48dp.png",
        "imageStyle": "IMAGE"
      },
      "sections": [{
        "widgets": [{
          "textParagraph": {
            "text": strData
          }
        },
        {
          "buttons": [{
            "textButton": {
              "text": "点此详情",
              "onClick": {
                "openLink": {
                  "url": "https://docs.google.com/spreadsheets/d/"+spreadsheet.getId()
                }
              }
            }
          }]
        }]
      }]
    }]
  });
  const options = {
      method: 'POST',
      contentType: 'application/json',
      payload: payload,
  };
  UrlFetchApp.fetch(GOOGLE_CHAT_WEBHOOK_LINK, options);
}

/**============在目标表格和Sheet中创建Chart表格并发送邮件============**/
function createPngAndEmail(saasTarget,sbnTarget) {
  try{
    console.log("正在创建Chart……");
    saas.toast("正在创建Chart……","提示",-1)
    let charts = sbnTarget.getCharts();
    for(let i=charts.length-1;i>-1;i--){
      sbnTarget.removeChart(charts[i]);
    }
    let chart = sbnTarget.newChart()
      .asTableChart()
      .addRange(sbnTarget.getRange('A1:J11'))
      .setMergeStrategy(Charts.ChartMergeStrategy.MERGE_COLUMNS)
      .setTransposeRowsAndColumns(false)
      .setNumHeaders(-1)
      .setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.IGNORE_BOTH)
      .setOption('bubble.stroke', '#000000')
      .setOption('annotations.domain.textStyle.color', '#808080')
      .setOption('textStyle.color', '#000000')
      .setOption('legend.textStyle.color', '#1a1a1a')
      .setOption('titleTextStyle.color', '#757575')
      .setOption('annotations.total.textStyle.color', '#808080')
      .setOption('width',800)
      .setPosition(9, 8, 18, 1)
      .build();
    sbnTarget.insertChart(chart);
    console.log(chart.getChartId());
    sendPng(saasTarget,sbnTarget,chart);
  }
  catch(e){
    let charts = sbnTarget.getCharts();
    for(let i=charts.length-1;i>-1;i--){
      sbnTarget.removeChart(charts[i]);
    }
    console.log("创建Chart并发送出现错误："+e.toString());
    saas.toast("创建Chart并发送出现错误："+e.toString(),"错误",-1)
  }
};

/**============发送Sheet中的Chart============**/
function sendPng(saasTarget,sbnTarget,chart){
  console.log("正在发送截图……");
  saas.toast("正在发送截图……","提示",-1)
  let saasTargetId=saasTarget.getId();
  //邮件中插入图片开始
  let chartBlobs; 
  let imageInEmails={};
  let emailBodyImage="";
  let token=ScriptApp.getOAuthToken();
  let baseUrl=`https://docs.google.com/spreadsheets/d/${saasTargetId}/embed/oimg?access_token=${token}&disposition=ATTACHMENT&bo=false&filetype=png&oid=`;
  let url=baseUrl + chart.getChartId();
  chartBlobs=UrlFetchApp.fetch(url).getBlob();
  emailBodyImage+="<img style='width:60%;height:60%' src='cid:chart'>";
  imageInEmails["chart"]= chartBlobs;
  //邮件中插入图片结束
  let attchmentImg=emailBodyImage;
  let arrMailBodyTitle=[["Beyond"]];
  let arrMailBodyData=[[""]];
  let toMail="jin_zhang@colpal.com";
  let ccMail="";
  let titleMail="SAP&DOMO Submit";
  let fromMail="CSX_Shift_Report@colpal.com";
  mailHtmlpng(toMail,titleMail,"Dear,",arrMailBodyTitle,arrMailBodyData,attchmentImg,ccMail,fromMail,imageInEmails);
  sbnTarget.removeChart(chart);
  saas.toast("邮件已发送！","结束：",-1)
}

/***发送含HTMLTXT的邮件***/
function mailHtmlpng(toMail,title,call,arrMailBodyTitle,arrMailBodyData,attchmentImg,ccMail,fromMail,imageInEmails){
  let html_txt='<div><p style="font-size:14px;color:black">'+
               call+//【称呼】
               '</p>';//+
  for(let i=0;i<arrMailBodyTitle.length;i++){
    html_txt=html_txt+'<div><p style="font-size:12px;color:magenta;margin-left:15px"><b>'+
               arrMailBodyTitle[i]+   //【描述1】         
               '</b></p>'+
               '<div><p style="font-size:12px;color:black;margin-left:30px">'+
               arrMailBodyData[i]+    //【描述2】
               '</p>'
  }
  html_txt=html_txt+'<div>'+attchmentImg+'</div>';
  let fromMails=GmailApp.getAliases();
  let position=fromMails.indexOf(fromMail);
  console.log(fromMails,fromMail,position);
  if(position!=-1){
    GmailApp.sendEmail(toMail, title,'' ,{htmlBody: html_txt,inlineImages:imageInEmails,cc:ccMail,from:fromMail}); 
  }
  else{
    GmailApp.sendEmail(toMail, title,'' ,{htmlBody: html_txt,inlineImages:imageInEmails,cc:ccMail}); 
  }  
}

/*============【获取数据FromExecel】模块用============*/
/***microSoft文档转换成Google***/
function microSoftToGoogle(fileName,fileId,folderId){
  try{
    let folder=DriveApp.getFolderById(folderId);    //定义存放转换后文件的临时文件夹
    let files=folder.getFiles();    //获取文件夹内所有以转换文件名命名的文件
    let file_next;
    while(files.hasNext()){   //循环所有同名文件
      file_next=files.next();   //定义当前文件
      if(file_next.getName().indexOf(fileName)!=-1||fileName.indexOf(file_next.getName())!=-1){
        file_next.setTrashed(true);   //删除文件
      }
    }
    let lastUpdate=DriveApp.getFileById(fileId).getLastUpdated();
    let now=new Date();
    let lastUpdateTime=new Date(lastUpdate).getTime();
    let nowTime=now.getTime();
    if(nowTime-lastUpdateTime<24*3600*1000){
      /**============MicroSoft文档转换Google文档通用程序【仅支持MyDrive】============**/
      // let res = Drive.Files.copy({parents: [{id: folderId}]}, fileId, {convert: true,,supportsAllDrives: true});    //调用Drive API v2.0转换MicroID文件为Google文件
      // return ["OK",res.id]   //并返回转换后的Google文件的ID
      /**============MicroSoft文档转换Google文档通用程序【支持MyDrive和ShareDrive】============**/
      let config = {title: fileName,parents: [{ id: folderId }]};   //{title: fileName,parents: [{ id: folderId }],mimeType: MimeType.GOOGLE_SHEETS}
      let blob=DriveApp.getFileById(fileId).getBlob();
      let res = Drive.Files.insert(config, blob, {convert: true, supportsAllDrives: true });       //调用Drive API v2.0转换MicroID文件为Google文件
      /**============如果有列的数据格式更改，清除下面的注释，修改表名和格式============**/
      // let sabiTemp=SpreadsheetApp.openById(res.id);
      // sabiTemp.setSpreadsheetTimeZone(currentTimeZone);
      // let sbnTemp=sabiTemp.getSheetByName("表名");
      // sbnTemp.getRange(1,1,sbnTemp.getLastRow(),1).setNumberFormat('YYYY-MM-DD HH:mm:ss');
      return ["OK",res.id]   //并返回转换后的Google文件的ID
    }
    else{
      return ["NO","检测到Excel在24小时内没有更新"];
    }
  }
  catch(e){
    return ["NO","转换出错："+e.toString()]
  }
}

/***Google文档转换成microSoft***/
function googleSpreadsheetAsExcel(saveFileName,saasId,saveToFolder){
  try {
    let files=saveToFolder.getFilesByName(saveFileName);
    while(files.hasNext()){
      let file_next=files.next();
      file_next.setTrashed(true);
    }
    let url="https://docs.google.com/spreadsheets/d/"+saasId+"/export?format=xlsx";
    let params={method:"get",headers:{"Authorization":"Bearer "+ScriptApp.getOAuthToken()},muteHttpExceptions:true};
    let blob=UrlFetchApp.fetch(url, params).getBlob();
    saveToFolder.createFile(blob).setName(saveFileName);
  }
  catch(e){
    console.log(e.toString());
  }
}

/***复制Sheet到另一个Spreadsheet***/
function copySheetData(sbnSource,sabiTarget,sbnTargetName){
  let sbnTarget=sabiTarget.getSheetByName(sbnTargetName);
  if(sbnTarget){
    sabiTarget.deleteSheet(sbnTarget);
  }
  sbnSource.copyTo(sabiTarget).setName(sbnTargetName);
}

/***时间转换成日期和时间***/ 
function timeToYMDHMS(timeTemp){
  let newYmdhms="";
  if(timeTemp){
    newYmdhms=Utilities.formatDate(new Date(timeTemp),currentTimeZone,"yyyy-MM-dd HH:mm:ss");
  }
  return newYmdhms;
}

/***计算时间差异***/
function calcDurationTime(timeStartProcess,timeEndProcess){
  let newDurationTime=0;
  if(timeStartProcess&&timeEndProcess){
    newDurationTime=Math.round((timeEndProcess-timeStartProcess)/1000*100/60)/100
  }
  return newDurationTime;
}

/***检测缓存目录并创建***/
function checkBufferFolder(folderName){
  folderName="Buffer_ExcelToGs";
  let rootFolder=DriveApp.getRootFolder();
  let bufferFolder=rootFolder.getFoldersByName(folderName);
  let count=0;
  let folderCount;
  let bufferFolderId="";
  while(bufferFolder.hasNext()){
    folderCount=bufferFolder.next();
    count=count+1;
  }
  if(count<1){
    bufferFolderId=rootFolder.createFolder(folderName).getId();
  }
  else{
    bufferFolderId=folderCount.getId();
  }
  return bufferFolderId;
}

/**============获取距今n天前的日期============**/
function getDateNDaysBack(n) {
  n = parseInt(n);
  let date = new Date();
  date.setDate(date.getDate() - n);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**============获取邮件标签(有则跳无则创建)============**/
function getGmailLabel(name) {
  let label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
  }
  return label;
}

/**============检测附件是否为定义的文件类型============**/
function checkIfDefinedType(attachment,myfileTypesToExtract) {
  let fileName = attachment.getName();
  let temp = fileName.split('.');
  let fileExtension = temp[temp.length - 1].toLowerCase();
  if (myfileTypesToExtract.indexOf(fileExtension) !== -1) return true;
  else return false;
}

/**============获取子文件夹(有则跳无则创建并清除其中的文件名为attchmentName的文件)============**/
function getSubFolder(parentFolder,nowDate,attachmentName){
  let folder=parentFolder;
  let subFolderId="";
  let subFolders=folder.getFoldersByName(nowDate)
  if(subFolders.hasNext()){
    let subFolderNext=subFolders.next();
    subFolderId=subFolderNext.getId();
  }
  else{
    subFolderId=folder.createFolder(nowDate).getId();
  }
  let subFolder=DriveApp.getFolderById(subFolderId);
  let files=subFolder.getFilesByName(attachmentName)
  while(files.hasNext()){
    let fileNext=files.next();
    fileNext.setTrashed(true);
  }
  return subFolder;
}

/**============在目标表格中插入Sheet(有则跳无则创建并清除其中的内容)============**/
function insertSheetFromNameAndClear(saasTarget,sheetName){
  let ssNums=saasTarget.getSheets();
  let exitSsIf="N";
  for(let i=0;i<ssNums.length;i++){
    if(ssNums[i].getSheetName()==sheetName){
      exitSsIf="Y";
      break;
    }
  }
  if(exitSsIf=="N"){
    saasTarget.insertSheet(ssNums.length-1).setName(sheetName);
  }
  let ss=saasTarget.getSheetByName(sheetName);
  let ssFilter=ss.getFilter();
  let ssMr=ss.getMaxRows();
  let ssMc=ss.getMaxColumns();
  if(ssFilter){ss.getFilter().remove()}
  if(ssMr>1){ss.deleteRows(2, ssMr-1)}
  // if(ssMc>1){ss.deleteColumns(2, ssMc-1)}
  return ss;
}