var TARGET_DATE = new Date();
TARGET_DATE.setDate(TARGET_DATE.getDate() + 7);

function copyFMT () {
  var FMT_ID = getFmtId();
  var fmt = DriveApp.getFileById(FMT_ID);
  var date = Utilities.formatDate(TARGET_DATE, 'JST', 'YYYYMMdd');
  var copy = fmt.makeCopy(date + '_出欠');
  var FORM_ID = copy.getId();
  var form = FormApp.openById(FORM_ID);
  return form;
}

function setupForm (form) {
  var SHEET_ID = getSheetId();
  var date = Utilities.formatDate(TARGET_DATE, 'JST', 'MM月dd日(E)');
  
  form.setTitle(date + '練習出欠')
    .setDescription('練習の出欠を取ります！');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, SHEET_ID);
  
  setupSheet(SHEET_ID);
  
  return form;
}

function setupSheet (sheet_id) {
  var date = Utilities.formatDate(TARGET_DATE, 'JST', 'MMdd');
  var spreadsheet = SpreadsheetApp.openById(sheet_id);
  var sheet = spreadsheet.getActiveSheet();

  sheet.setName(date +'出欠');
  //spreadsheet.moveActiveSheet(2);

  return true;
}

function getNewForm () {
  var FMT = copyFMT();
  var form = setupForm(FMT);
  return form;
}

function sendLINE (message, TOKEN) {
  var URL = 'https://notify-api.line.me/api/notify';
  var options = {
    "medhod" : "post",
    "payload" : "message=" + message,
    "headers" : {
      "Authorization" : "Bearer " + TOKEN
    }
  };
  return UrlFetchApp.fetch(URL, options);
}

function createMessage (form_url, schedule) {
  var message = '来週は練習があります！\n';
  message += '詳細は以下の通りです．\n';
  message += 'フォームから出欠予定を「全員」回答してください！\n';
  message += form_url + '\n';
  message += '回答状況はコチラ↓' + '\n';
  message += SHEET_URL + '\n';
  message += '-----\n';
  message += schedule.getTitle() + '\n';
  message += dateFormat(TARGET_DATE);
  message += timeFormat(schedule.getStartTime()) + '-' + timeFormat(schedule.getEndTime()) + '\n';
  message += schedule.getLocation() + '\n';
  Logger.log(message);
  return message;
}

function timeFormat (date) {
  return Utilities.formatDate(date, 'JST', 'HH:mm');
}

function dateFormat (date) {
  return Utilities.formatDate(date, 'JST', 'MM月dd日(E)');
}

function main (schedule) {
  var form = getNewForm();
  if (form !== null) {
    var form_url = form.getPublishedUrl();
    var message = createMessage(form_url, schedule);
    var TOKEN = getLINEToken();
    sendLINE(message, TOKEN);
  } else {
    Logger.log('ザンネーーン');
    return false;
  }
}

function checkSchedule () {
  var CALENDAR_ID = getCalendarId();
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  var schedules = calendar.getEventsForDay(TARGET_DATE);
  if (schedules.length <= 0) {
    Logger.log('来週は予定がありません...')
  } else {
    schedules.forEach (function (schedule) {
      if (schedule.getTitle().indexOf('練習') > -1) {
        Logger.log('来週は練習があります！！');
        main(schedule);
      } else {
        Logger.log('来週は練習がありません！！！');
      }
    });
  }
}