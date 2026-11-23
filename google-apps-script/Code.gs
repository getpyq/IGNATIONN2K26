/**
 * IGNITION 2K26 — Real-Time Google Sheets Backend via Google Apps Script
 *
 * Setup Instructions:
 * 1. Create or open a Google Sheet.
 * 2. Open Extensions -> Apps Script, delete any starter code, and paste this entire file.
 * 3. Click Deploy -> New deployment -> Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 *
 * Required tabs (`Registrations` and `AdminAccounts`) and all column headers
 * are created and migrated automatically on first request.
 */

var SHEET_REGISTRATIONS = 'Registrations';
var SHEET_ADMINS = 'AdminAccounts';

var REG_HEADERS = [
  'id',
  'student_name',
  'selected_talents',
  'other_talent_description',
  'food_preference',
  'pass_number',
  'created_at',
  'checked_in',
  'checkin_time',
  'checked_in_by',
];

var ADMIN_HEADERS = [
  'id',
  'full_name',
  'phone_number',
  'passcode',
  'role',
  'is_active',
  'created_at',
  'updated_at',
];

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheet(name, requiredHeaders) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(requiredHeaders);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold');
    return sheet;
  }

  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, requiredHeaders.length).setFontWeight('bold');
    return sheet;
  }

  var existingLastCol = sheet.getLastColumn();
  var currentHeaders = sheet
    .getRange(1, 1, 1, existingLastCol)
    .getValues()[0]
    .map(function (h) {
      return String(h || '').trim();
    });

  var missing = [];
  for (var i = 0; i < requiredHeaders.length; i++) {
    if (currentHeaders.indexOf(requiredHeaders[i]) === -1) {
      missing.push(requiredHeaders[i]);
    }
  }

  if (missing.length > 0) {
    var startCol = existingLastCol + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    sheet
      .getRange(1, startCol, 1, missing.length)
      .setFontWeight('bold');
  }

  if (sheet.getFrozenRows() < 1) {
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getHeaderMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '').trim();
    if (key) map[key] = i + 1;
  }
  return map;
}

function sheetRowsToObjects(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  var headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (h) {
      return String(h || '').trim();
    });
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function (row, idx) {
    var obj = { _rowIndex: idx + 2 };
    for (var i = 0; i < headers.length; i++) {
      if (headers[i]) {
        obj[headers[i]] = row[i];
      }
    }
    return obj;
  });
}

function appendObjectRow(sheet, requiredHeaders, obj) {
  var headerMap = getHeaderMap(sheet);
  var maxCol = Math.max(sheet.getLastColumn(), requiredHeaders.length);
  var rowValues = [];
  for (var c = 0; c < maxCol; c++) {
    rowValues.push('');
  }
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && headerMap[key]) {
      rowValues[headerMap[key] - 1] = obj[key];
    }
  }
  sheet.appendRow(rowValues);
}

function updateRowCell(sheet, rowIndex, headerMap, colName, value) {
  var colIdx = headerMap[colName];
  if (colIdx) {
    sheet.getRange(rowIndex, colIdx).setValue(value);
  }
}

function ensureAllSheets() {
  ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
  ensureSheet(SHEET_ADMINS, ADMIN_HEADERS);
}

function toBool(val) {
  return (
    val === true ||
    String(val).toLowerCase() === 'true' ||
    Number(val) === 1
  );
}

function toIsoString(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function getRegistrationCount() {
  ensureAllSheets();
  var regSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
  var totalRegs = Math.max(0, regSheet.getLastRow() - 1);
  return {
    current_registrations: totalRegs,
  };
}

function mapRegistrationObject(row) {
  var talents = [];
  if (Array.isArray(row.selected_talents)) {
    talents = row.selected_talents;
  } else {
    try {
      talents = JSON.parse(String(row.selected_talents || '[]'));
    } catch (e) {
      talents = [];
    }
  }
  return {
    id: String(row.id),
    student_name: String(row.student_name),
    selected_talents: talents,
    other_talent_description: row.other_talent_description
      ? String(row.other_talent_description)
      : null,
    food_preference: String(row.food_preference),
    pass_number: String(row.pass_number),
    created_at: toIsoString(row.created_at),
    checked_in: toBool(row.checked_in),
    checkin_time: row.checkin_time ? toIsoString(row.checkin_time) : null,
    checked_in_by: row.checked_in_by ? String(row.checked_in_by) : null,
  };
}

function mapAdminObject(row) {
  return {
    id: String(row.id),
    full_name: String(row.full_name),
    phone_number: String(row.phone_number),
    passcode: String(row.passcode || ''),
    role: String(row.role),
    is_active: toBool(row.is_active),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

function parseSerialFromPass(passNumber) {
  var pn = String(passNumber || '').trim().toUpperCase();
  if (pn.indexOf('IGNITION26-') === 0) {
    var num1 = parseInt(pn.substring(11), 10);
    return isNaN(num1) ? 0 : num1;
  }
  if (pn.indexOf('IGN26-ME-') === 0) {
    var num2 = parseInt(pn.substring(9), 10);
    return isNaN(num2) ? 0 : num2;
  }
  return 0;
}

function doGet(e) {
  try {
    ensureAllSheets();
    var action = (e && e.parameter && e.parameter.action) || 'health';
    if (action === 'health') {
      return jsonOutput({ ok: true, backend: 'google_sheets' });
    }
    if (action === 'getRegistrationCount' || action === 'getPublicSettings') {
      return jsonOutput({ ok: true, data: getRegistrationCount() });
    }
    return jsonOutput({ ok: false, error: 'Unsupported GET action.' });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    ensureAllSheets();
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var action = body.action;
    var payload = body.payload || {};

    if (action === 'getRegistrationCount' || action === 'getPublicSettings') {
      return jsonOutput({ ok: true, data: getRegistrationCount() });
    }

    if (action === 'registerStudent') {
      lock.waitLock(15000);
      var regSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
      var existingRows = sheetRowsToObjects(regSheet);

      if (payload.registration_open === false) {
        return jsonOutput({
          ok: false,
          status: 403,
          error: 'Registrations are currently closed for this event.',
        });
      }
      var maxCapacity = Number(payload.maximum_registrations) || 500;
      if (existingRows.length >= maxCapacity) {
        return jsonOutput({
          ok: false,
          status: 409,
          error: 'Maximum registration capacity has been reached.',
        });
      }

      var maxSeq = 0;
      for (var j = 0; j < existingRows.length; j++) {
        var seq = parseSerialFromPass(existingRows[j].pass_number);
        if (seq > maxSeq) maxSeq = seq;
      }
      var nextSeq = maxSeq + 1;
      var passNumber = 'IGNITION26-' + ('00000' + nextSeq).slice(-5);
      var id = passNumber;
      var createdAt = new Date().toISOString();

      appendObjectRow(regSheet, REG_HEADERS, {
        id: id,
        student_name: payload.student_name,
        selected_talents: JSON.stringify(payload.selected_talents || []),
        other_talent_description: payload.other_talent_description || '',
        food_preference: payload.food_preference,
        pass_number: passNumber,
        created_at: createdAt,
        checked_in: false,
        checkin_time: '',
        checked_in_by: '',
      });

      return jsonOutput({
        ok: true,
        data: {
          id: id,
          student_name: payload.student_name,
          selected_talents: payload.selected_talents || [],
          other_talent_description: payload.other_talent_description || null,
          food_preference: payload.food_preference,
          pass_number: passNumber,
          created_at: createdAt,
          checked_in: false,
          checkin_time: null,
          checked_in_by: null,
        },
      });
    }

    if (action === 'verifyPass') {
      var vSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
      var vRows = sheetRowsToObjects(vSheet);
      var match = null;
      for (var k = 0; k < vRows.length; k++) {
        var vr = vRows[k];
        var vId = String(vr.id || '').trim();
        var vPass = String(vr.pass_number || '').trim().toUpperCase();
        var qId = payload.id ? String(payload.id).trim() : '';
        var qPass = payload.pass_number ? String(payload.pass_number).trim().toUpperCase() : '';

        if (qId && qPass && (vId === qId || vPass === qPass) && vPass === qPass) {
          match = mapRegistrationObject(vr);
          break;
        }
        if (qPass && vPass === qPass) {
          match = mapRegistrationObject(vr);
          break;
        }
        if (qId && (vId === qId || vPass === qId.toUpperCase())) {
          match = mapRegistrationObject(vr);
          break;
        }
      }
      if (!match) {
        return jsonOutput({ ok: true, data: null });
      }
      return jsonOutput({
        ok: true,
        data: {
          verified: true,
          pass_number: match.pass_number,
          student_name: match.student_name,
        },
      });
    }

    if (action === 'lookupAndCheckIn') {
      lock.waitLock(15000);
      var ciSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
      var ciRows = sheetRowsToObjects(ciSheet);
      var ciHeaderMap = getHeaderMap(ciSheet);
      var target = null;

      for (var ciIdx = 0; ciIdx < ciRows.length; ciIdx++) {
        var row = ciRows[ciIdx];
        var rId = String(row.id || '').trim();
        var rPass = String(row.pass_number || '').trim().toUpperCase();
        var pId = payload.id ? String(payload.id).trim() : '';
        var pPass = payload.pass_number ? String(payload.pass_number).trim().toUpperCase() : '';

        if (pPass && rPass === pPass) {
          target = row;
          break;
        }
        if (pId && (rId === pId || rPass === pId.toUpperCase())) {
          target = row;
          break;
        }
      }

      if (!target) {
        return jsonOutput({
          ok: false,
          status: 404,
          error: 'No matching student registration found for this code.',
        });
      }

      var wasCheckedIn = toBool(target.checked_in);
      var newlyCheckedIn = false;

      if (payload.auto_checkin && !wasCheckedIn) {
        var checkinNow = new Date().toISOString();
        var checkedBy = String(payload.checked_in_by || 'Organizer');
        updateRowCell(ciSheet, target._rowIndex, ciHeaderMap, 'checked_in', true);
        updateRowCell(
          ciSheet,
          target._rowIndex,
          ciHeaderMap,
          'checkin_time',
          checkinNow
        );
        updateRowCell(
          ciSheet,
          target._rowIndex,
          ciHeaderMap,
          'checked_in_by',
          checkedBy
        );
        target.checked_in = true;
        target.checkin_time = checkinNow;
        target.checked_in_by = checkedBy;
        newlyCheckedIn = true;
      }

      return jsonOutput({
        ok: true,
        data: {
          record: mapRegistrationObject(target),
          newly_checked_in: newlyCheckedIn,
          already_checked_in: wasCheckedIn,
        },
      });
    }

    if (action === 'adminBootstrapStatus') {
      var aSheet = ensureSheet(SHEET_ADMINS, ADMIN_HEADERS);
      var aRows = sheetRowsToObjects(aSheet);
      var hasSuper = aRows.some(function (r) {
        return String(r.role) === 'super_admin';
      });
      return jsonOutput({ ok: true, data: { initialized: hasSuper } });
    }

    if (action === 'adminBootstrap') {
      lock.waitLock(15000);
      var bSheet = ensureSheet(SHEET_ADMINS, ADMIN_HEADERS);
      var bRows = sheetRowsToObjects(bSheet);
      var already = bRows.some(function (r) {
        return String(r.role) === 'super_admin';
      });
      if (already) {
        return jsonOutput({
          ok: false,
          status: 403,
          error: 'Super Admin account has already been initialized.',
        });
      }
      var adminId = Utilities.getUuid();
      var now = new Date().toISOString();
      appendObjectRow(bSheet, ADMIN_HEADERS, {
        id: adminId,
        full_name: payload.full_name,
        phone_number: "'" + String(payload.phone_number || ''),
        passcode: "'" + String(payload.passcode || ''),
        role: 'super_admin',
        is_active: true,
        created_at: now,
        updated_at: now,
      });
      return jsonOutput({
        ok: true,
        data: {
          id: adminId,
          full_name: payload.full_name,
          phone_number: payload.phone_number,
          role: 'super_admin',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      });
    }

    if (action === 'adminFindByPhone') {
      var pSheet = ensureSheet(SHEET_ADMINS, ADMIN_HEADERS);
      var pRows = sheetRowsToObjects(pSheet);
      var foundPhone = null;
      for (var m = 0; m < pRows.length; m++) {
        if (String(pRows[m].phone_number).trim() === String(payload.phone_number).trim()) {
          foundPhone = mapAdminObject(pRows[m]);
          break;
        }
      }
      return jsonOutput({ ok: true, data: foundPhone });
    }

    if (action === 'adminFindById') {
      var idSheet = ensureSheet(SHEET_ADMINS, ADMIN_HEADERS);
      var idRows = sheetRowsToObjects(idSheet);
      var foundId = null;
      for (var n = 0; n < idRows.length; n++) {
        if (String(idRows[n].id) === String(payload.id)) {
          foundId = mapAdminObject(idRows[n]);
          break;
        }
      }
      return jsonOutput({ ok: true, data: foundId });
    }

    if (action === 'listRegistrations') {
      var rSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
      var rRows = sheetRowsToObjects(rSheet);
      return jsonOutput({
        ok: true,
        data: rRows.map(mapRegistrationObject),
      });
    }

    if (action === 'updateRegistration') {
      lock.waitLock(15000);
      var uSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
      var uRows = sheetRowsToObjects(uSheet);
      var uHeaderMap = getHeaderMap(uSheet);
      var targetRow = null;
      var targetLookup = String(payload.id || '').trim();
      for (var x = 0; x < uRows.length; x++) {
        if (
          String(uRows[x].id || '').trim() === targetLookup ||
          String(uRows[x].pass_number || '').trim().toUpperCase() ===
            targetLookup.toUpperCase()
        ) {
          targetRow = uRows[x];
          break;
        }
      }
      if (!targetRow) {
        return jsonOutput({
          ok: false,
          status: 404,
          error: 'Registration record not found.',
        });
      }
      updateRowCell(
        uSheet,
        targetRow._rowIndex,
        uHeaderMap,
        'student_name',
        payload.student_name
      );
      updateRowCell(
        uSheet,
        targetRow._rowIndex,
        uHeaderMap,
        'selected_talents',
        JSON.stringify(payload.selected_talents || [])
      );
      updateRowCell(
        uSheet,
        targetRow._rowIndex,
        uHeaderMap,
        'other_talent_description',
        payload.other_talent_description || ''
      );
      updateRowCell(
        uSheet,
        targetRow._rowIndex,
        uHeaderMap,
        'food_preference',
        payload.food_preference
      );

      var refreshed = sheetRowsToObjects(uSheet);
      var updatedObj = null;
      for (var y = 0; y < refreshed.length; y++) {
        if (String(refreshed[y].id) === String(targetRow.id)) {
          updatedObj = mapRegistrationObject(refreshed[y]);
          break;
        }
      }
      return jsonOutput({ ok: true, data: updatedObj });
    }

    if (action === 'deleteRegistration') {
      lock.waitLock(15000);
      var dSheet = ensureSheet(SHEET_REGISTRATIONS, REG_HEADERS);
      var dRows = sheetRowsToObjects(dSheet);
      var dLookup = String(payload.id || payload.pass_number || '').trim();
      if (!dLookup) {
        return jsonOutput({
          ok: false,
          status: 400,
          error: 'Missing registration ID to delete.',
        });
      }

      var deleteTarget = null;
      for (var dIdx = 0; dIdx < dRows.length; dIdx++) {
        var drId = String(dRows[dIdx].id || '').trim();
        var drPass = String(dRows[dIdx].pass_number || '').trim().toUpperCase();
        if (drId === dLookup || drPass === dLookup.toUpperCase()) {
          deleteTarget = dRows[dIdx];
          break;
        }
      }

      if (!deleteTarget || deleteTarget._rowIndex < 2) {
        return jsonOutput({
          ok: false,
          status: 404,
          error: 'Registration record not found.',
        });
      }

      var deletedId = String(deleteTarget.id || '');
      var deletedPass = String(deleteTarget.pass_number || '');
      dSheet.deleteRow(deleteTarget._rowIndex);

      return jsonOutput({
        ok: true,
        data: {
          deleted: true,
          id: deletedId,
          pass_number: deletedPass,
        },
      });
    }

    return jsonOutput({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}
