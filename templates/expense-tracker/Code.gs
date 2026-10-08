/** BotStore expense tracker. No external services. */
function onOpen(){SpreadsheetApp.getUi().createMenu('BotStore').addItem('Set up expenses','setupExpenses').addToUi();}
function setupExpenses(){
 const ss=SpreadsheetApp.getActive();let s=ss.getSheetByName('Finance');
 if(s && s.getLastRow()>0){SpreadsheetApp.getUi().alert('Finance already contains data. Nothing changed.');return;}
 s=s||ss.insertSheet('Finance');
 s.getRange('A1:E1').setValues([['Date / Күні / Дата','Category / Санат / Категория','Income KZT / Кіріс / Доход','Expense KZT / Шығыс / Расход','Note / Ескерту / Заметка']]);
 s.getRange('A1:E1').setBackground('#25997b').setFontColor('#ffffff').setFontWeight('bold');s.setFrozenRows(1);s.getRange('C2:D1000').setNumberFormat('#,##0 "₸"');s.autoResizeColumns(1,5);
 let r=ss.getSheetByName('Finance Summary')||ss.insertSheet('Finance Summary');
 if(r.getLastRow()===0){r.getRange('A1:B4').setValues([['Metric','KZT'],['Income','=SUM(Finance!C2:C1000)'],['Expenses','=SUM(Finance!D2:D1000)'],['Profit','=B2-B3']]);r.autoResizeColumns(1,2);}
 SpreadsheetApp.getUi().alert('Ready / Дайын / Готово');
}
