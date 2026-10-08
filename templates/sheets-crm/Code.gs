/** BotStore CRM. Paste into Extensions > Apps Script in your own spreadsheet. */
function onOpen() { SpreadsheetApp.getUi().createMenu('BotStore').addItem('Set up CRM', 'setupCRM').addToUi(); }
function setupCRM() {
 const ss=SpreadsheetApp.getActive();
 let sheet=ss.getSheetByName('CRM');
 if(sheet && sheet.getLastRow()>0) {SpreadsheetApp.getUi().alert('CRM already contains data. Nothing changed.'); return;}
 sheet=sheet || ss.insertSheet('CRM');
 sheet.getRange('A1:G1').setValues([['Date / Күні / Дата','Client / Клиент','Phone / Телефон','Service / Қызмет / Услуга','Amount KZT / Сома / Сумма','Status / Статус','Notes / Ескерту / Заметки']]);
 sheet.getRange('A1:G1').setBackground('#5c50e8').setFontColor('#ffffff').setFontWeight('bold');
 sheet.setFrozenRows(1);sheet.getRange('C2:C1000').setNumberFormat('@');sheet.getRange('E2:E1000').setNumberFormat('#,##0 "₸"');
 const validation=SpreadsheetApp.newDataValidation().requireValueInList(['New','In progress','Paid','Cancelled'],true).setAllowInvalid(false).build();
 sheet.getRange('F2:F1000').setDataValidation(validation);sheet.autoResizeColumns(1,7);
 let summary=ss.getSheetByName('CRM Summary')||ss.insertSheet('CRM Summary');
 if(summary.getLastRow()===0){summary.getRange('A1:B3').setValues([['Metric','Value'],['Paid revenue','=SUMIF(CRM!F2:F1000,"Paid",CRM!E2:E1000)'],['Orders','=COUNTA(CRM!B2:B1000)']]);summary.autoResizeColumns(1,2);}
 SpreadsheetApp.getUi().alert('CRM ready / CRM дайын / CRM готова');
}
