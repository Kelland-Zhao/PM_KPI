/******取消所有定时任务******/
function cancelAllTimeDrivenTriggers(){
  let triggers=ScriptApp.getProjectTriggers();
  console.log(triggers.length);
  for(let i=triggers.length-1;i>-1;i--){
    if (triggers[i].getEventType() === ScriptApp.EventType.CLOCK) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
    // ScriptApp.deleteTrigger(triggers[i]);
  }
}

/******每天运行一次精准时间触发任务******/
function timeExec() {
  cancelAllTimeDrivenTriggers();
  let setHour=12;
  let setMinute=30;
  ScriptApp.newTrigger('createSpecialTimeDrivenTriggers')
    .timeBased()
    .everyDays(1) // 每天触发
    .atHour(setHour) // 指定在每天的设定小时触发
    .nearMinute(setMinute) // 尽可能接近每天设定小时:分钟
    .create();
  createSpecialTimeDrivenTriggers();
}

function createSpecialTimeDrivenTriggers() {
  let sbnTimingSetLr=sbnTimingSet.getLastRow();
  let arrSetTime=[];
  if(sbnTimingSetLr>2){arrSetTime=sbnTimingSet.getRange(3,1,sbnTimingSetLr-2,7).getDisplayValues().filter(v=>{return v[0]!=""&&v[1]!=""&&v[2]!=""&&v[3]!=""&&v[4]!=""&&v[5]!=""&&v[6]!=""})}
  if(arrSetTime.length>0){
    // 获取当前日期，但不对时间进行设置
    let now = new Date();
    let nowTime=now.getTime();
    let nowYear = now.getFullYear();
    let nowMonth = now.getMonth();
    let nowDay = now.getDate();
    let strDes="";
    let strFunction="";
    let arrSetTimeRow=[];
    let hourSetTimeRow=[];
    let minuteSetTimeRow=[];
    let specificTime = new Date(nowTime);
    let nowOver30Minute=new Date(nowTime+0.5*3600*1000);
    let arrMonth=[];
    let arrWeek=[];
    let arrWeekInMonth=[];
    let arrDay=[];
    let setExec=new Date(nowTime);
    let month_setExec=setExec.getMonth()+1;
    let week_setExec=setExec.getDay();
    let weekInMonth_setExec=getWeekInMonth(setExec);
    let day_setExec=setExec.getDate();
    for(let i=0;i<arrSetTime.length;i++){
      arrMonth=JSON.parse(arrSetTime[i][0]);
      arrWeek=JSON.parse(arrSetTime[i][1]);
      arrWeekInMonth=JSON.parse(arrSetTime[i][2]);
      arrDay=JSON.parse(arrSetTime[i][3]);
      strDes=arrSetTime[i][4];
      strFunction=arrSetTime[i][6];
      // 取消之前的定时任务
      cancelAssignstrFunction(strFunction);
      arrSetTimeRow=arrSetTime[i][4].split("|");
      for(let j=0;j<arrSetTimeRow.length;j++){
        hourSetTimeRow=Number(arrSetTimeRow[j].split(":")[0]);
        minuteSetTimeRow=Number(arrSetTimeRow[j].split(":")[1]);
        if(hourSetTimeRow>=0&&minuteSetTimeRow>=0){
          // 对每个时间点创建全新的日期对象
          specificTime = new Date(nowYear, nowMonth, nowDay, hourSetTimeRow, minuteSetTimeRow, 0);
          if(nowOver30Minute>specificTime){
            specificTime = new Date(nowYear, nowMonth, nowDay+1, hourSetTimeRow, minuteSetTimeRow, 0);
          }
          month_setExec=specificTime.getMonth()+1;
          week_setExec=specificTime.getDay();
          weekInMonth_setExec=getWeekInMonth(specificTime);
          day_setExec=specificTime.getDate();
          console.log({
            "当前月":(month_setExec)+"；是否在设置里："+arrMonth.indexOf(month_setExec),
            "当前星期":week_setExec+"；是否在设置里："+arrWeek.indexOf(week_setExec),
            "当前周In月":weekInMonth_setExec+"；是否在设置里："+arrWeekInMonth.indexOf(weekInMonth_setExec),
            "当前日":day_setExec+"；是否在设置里："+arrDay.indexOf(day_setExec),
            "程序名称:":strDes,
            "函数名：":strFunction,
            "触发时间：":formatVariableAsDateHms(specificTime)
          })
          if(arrMonth.indexOf(month_setExec)!=-1&&arrWeek.indexOf(week_setExec)!=-1&&arrWeekInMonth.indexOf(weekInMonth_setExec)!=-1&&arrDay.indexOf(day_setExec)!=-1){
            // 创建定时器
            ScriptApp.newTrigger(strFunction)
                .timeBased()
                .at(specificTime)
                .create();
          }
        }
      }
    }
  }
}

/******取消指定定时任务******/
function cancelAssignstrFunction(strFunction){
  let triggers=ScriptApp.getProjectTriggers();
  for(let i=triggers.length-1;i>-1;i--){
    console.log(triggers[i].getHandlerFunction())
    if(triggers[i].getHandlerFunction()==strFunction){
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}


/******设置每30分钟运行一次【不用了，已改精准触发】******/
// function setToRunEvery30minutes(){
//   let triggers=ScriptApp.getProjectTriggers();
//   console.log(triggers.length);
//   for(let i=triggers.length-1;i>-1;i--){
//     ScriptApp.deleteTrigger(triggers[i]);
//   }
//   //每30分钟运行
//   ScriptApp.newTrigger('timeExec')
//     .timeBased()
//     .everyMinutes(30)
//     .create();
// }

/******每30分钟运行一次的程序【不用了，已改精准触发】******/
// function timeExec() {
//   cancelAllTimeDrivenTriggers();
//   let sbnTimingSetLr=sbnTimingSet.getLastRow();
//   let arrSetTime=[];
//   let now=new Date();
//   let nowTime=now.getTime();
//   let setExec=new Date(nowTime);
//   let setExecTime=setExec.getTime();
//   let nowYear=now.getFullYear();    /**设置年**/
//   let nowMonth=now.getMonth();    /**设置月**/
//   let nowDay=now.getDay();    /**设置周**/
//   let nowDate=now.getDate();    /**设置日**/
//   let nowHour=now.getHours();
//   let nowMinute=now.getMinutes();    /**设置分**/
//   let nowSecond=now.getSeconds();      /**设置秒**/                                                                                                                                               
//   let nowMillisencond=now.getMilliseconds();    /**设置毫秒**/
//   if(sbnTimingSetLr>2){arrSetTime=sbnTimingSet.getRange(3,1,sbnTimingSetLr-2,6).getDisplayValues().filter(v=>{return v[0]!=""&&v[1]!=""&&v[2]!=""&&v[3]!=""&&v[4]!=""&&v[5]!=""})}
//   if(arrSetTime.length>0){
//     for(let i=0;i<arrSetTime.length;i++){
//       let hour=arrSetTime[i][4].toString().split(":")[0];
//       let minute=arrSetTime[i][4].toString().split(":")[1];
//       let arrMonth=JSON.parse(arrSetTime[i][0]);
//       let arrWeek=JSON.parse(arrSetTime[i][1]);
//       let arrWeekInMonth=JSON.parse(arrSetTime[i][2]);
//       let arrDay=JSON.parse(arrSetTime[i][3]);
//       nowTime=now.getTime();
//       setExec=new Date(nowTime);
//       console.log({"now":now,"setExec":setExec});
//       nowTime=now.getTime();
//       nowYear=now.getFullYear();    /**设置年**/
//       nowMonth=now.getMonth();    /**设置月**/
//       nowDay=now.getDay();    /**设置周**/
//       nowDate=now.getDate();    /**设置日**/
//       nowHour=now.getHours();
//       nowMinute=now.getMinutes();    /**设置分**/
//       nowSecond=now.getSeconds();      /**设置秒**/                                                                                                                                               
//       nowMillisencond=now.getMilliseconds();    /**设置毫秒**/
//       setExec.setFullYear(nowYear);
//       setExec.setMonth(nowMonth);
//       setExec.setDate(nowDate);
//       setExec.setHours(Number(hour));
//       setExec.setMinutes(Number(minute));
//       setExec.setSeconds(nowSecond);
//       setExec.setMilliseconds(nowMillisencond);
//       setExecTime=setExec.getTime();
//       let currentWeekInMonth=getWeekInMonth(setExec);
//       console.log({
//         "当前月":(setExec.getMonth()+1)+"；是否在设置里："+arrMonth.indexOf(setExec.getMonth()+1),
//         "当前星期":setExec.getDay()+"；是否在设置里："+arrWeek.indexOf(setExec.getDay()),
//         "当前周In月":currentWeekInMonth+"；是否在设置里："+arrWeekInMonth.indexOf(currentWeekInMonth),
//         "当前日":setExec.getDate()+"是否在设置里："+arrDay.indexOf(setExec.getDate()),
//         "程序名称:":arrSetTime[i][5],
//         "设置时间前20分钟":formatVariableAsDateHm(newTimeBefore(setExecTime)),
//         "运行时间":formatVariableAsDateHm(now),
//         "设置时间后10分钟":formatVariableAsDateHm(newTimeAfter(setExecTime)),
//         "时间对比":formatVariableAsDateHm(newTimeBefore(setExecTime))<formatVariableAsDateHm(now)&&formatVariableAsDateHm(now)<=formatVariableAsDateHm(newTimeAfter(setExecTime))
//       });
//       if(arrMonth.indexOf(setExec.getMonth()+1)!=-1&&arrWeek.indexOf(setExec.getDay())!=-1&&arrWeekInMonth.indexOf(currentWeekInMonth)!=-1&&arrDay.indexOf(setExec.getDate())!=-1&&formatVariableAsDateHm(newTimeBefore(setExec))<formatVariableAsDateHm(now)&&formatVariableAsDateHm(now)<=formatVariableAsDateHm(newTimeAfter(setExecTime))){
//         if(arrSetTime[i][5]=="以邮件设置发送邮件"){
//           getSendMailsContents();
//         }
//         else if(arrSetTime[i][5]=="Excel转换GoogleSheet"){
//           getRecord_Array();
//         }
//         else if(arrSetTime[i][5]=="从邮件中获取MS并转换GS"){
//           getEmailAttchment();
//         }
//         else if(arrSetTime[i][5]=="GoogleSheet转换Excel"){
//           gsToMs()
//         }
//         else if(arrSetTime[i][5]=="多表合并一表"){
//           multipleSpreadToOneSpread()
//         }
//         else if(arrSetTime[i][5]=="IoT数据堆叠"){
//           StackData();
//         }
//         else if(arrSetTime[i][5]=="发送消息"){
//           sendChatMessage()
//         }
//         else{
//           console.log("无调用");
//         }
//       }
//     }
//   }
// }