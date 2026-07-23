const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { pool } = require('./db');

// Full-database SQL dump plus helpers for the admin backup module. The dump
// disables FK checks so tables can be dropped and refilled in any order;
// alphabetical order keeps the file diffable between backups.

function quoteIdent(name) {
  return '`' + String(name).replace(/`/g, '``') + '`';
}

const INSERT_CHUNK = 200;

// mysql2 parses JSON columns into arrays/objects, and escape() would expand
// those into value lists. Serialize them back to JSON text before escaping.
// Buffers (blobs) pass through, escape() turns them into hex literals.
function escapeValue(conn, value) {
  if (value !== null && typeof value === 'object' && !Buffer.isBuffer(value) && !(value instanceof Date)) {
    return conn.escape(JSON.stringify(value));
  }
  return conn.escape(value);
}

async function dumpDatabase() {
  const conn = await pool.getConnection();
  try {
    const [tables] = await conn.query(
      'SELECT TABLE_NAME AS name FROM information_schema.TABLES ' +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
    );
    const lines = [];
    lines.push('-- Car Spa LK database backup');
    lines.push('-- Generated ' + new Date().toISOString());
    lines.push('SET FOREIGN_KEY_CHECKS=0;');
    lines.push('');
    for (const table of tables) {
      const name = table.name;
      const [createRows] = await conn.query('SHOW CREATE TABLE ' + quoteIdent(name));
      lines.push('DROP TABLE IF EXISTS ' + quoteIdent(name) + ';');
      lines.push(createRows[0]['Create Table'] + ';');
      lines.push('');
      const [rows] = await conn.query('SELECT * FROM ' + quoteIdent(name));
      if (rows.length) {
        const cols = Object.keys(rows[0]);
        const colList = cols.map(quoteIdent).join(', ');
        for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
          const values = rows.slice(i, i + INSERT_CHUNK).map(function (row) {
            return '(' + cols.map(function (col) { return escapeValue(conn, row[col]); }).join(', ') + ')';
          });
          lines.push(
            'INSERT INTO ' + quoteIdent(name) + ' (' + colList + ') VALUES\n' +
            values.join(',\n') + ';'
          );
        }
        lines.push('');
      }
    }
    lines.push('SET FOREIGN_KEY_CHECKS=1;');
    lines.push('');
    return lines.join('\n');
  } finally {
    conn.release();
  }
}

// Runs an uploaded dump against the live database on a one-off connection.
// multipleStatements stays off on the app pool, so the restore gets its own
// connection built from the same env config as lib/db.js.
async function restoreDatabase(sqlText) {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'carspa',
    multipleStatements: true,
    dateStrings: true
  });
  try {
    await conn.query(sqlText);
  } finally {
    await conn.end().catch(function () {});
  }
}

async function folderSizeBytes(dir) {
  let total = 0;
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch (err) {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await folderSizeBytes(full);
    } else if (entry.isFile()) {
      const stat = await fs.promises.stat(full).catch(function () { return null; });
      if (stat) total += stat.size;
    }
  }
  return total;
}

function humanSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return (i === 0 ? String(n) : n.toFixed(1)) + ' ' + units[i];
}

module.exports = { dumpDatabase, restoreDatabase, folderSizeBytes, humanSize };
