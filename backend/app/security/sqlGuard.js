/**
 * SQL GUARD - defensa en profundidad para el chatbot
 * ==================================================
 * El LLM nunca genera SQL. Las herramientas de cuenta ejecutan consultas
 * fijas y parametrizadas dentro de un contexto AsyncLocalStorage marcado
 * como READ ONLY. Cualquier SQL que se ejecute dentro de ese contexto:
 *   1. Se limpia de literales y comentarios.
 *   2. Debe empezar por SELECT / WITH / VALUES.
 *   3. No puede contener una segunda sentencia.
 *   4. No puede contener palabras de escritura o administracion.
 *
 * odbcConfig consulta este modulo antes de ejecutar la query y fuerza
 * ademas "SET TRANSACTION READ ONLY" en la conexion.
 */

const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

class SqlGuardError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SqlGuardError';
    this.code = 'SQL_GUARD_BLOCKED';
  }
}

const WRITE_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|MERGE|DROP|ALTER|CREATE|TRUNCATE|RENAME|GRANT|REVOKE|CALL|EXECUTE|SET|DECLARE|IMPORT|EXPORT|REORG|CLUSTER|SAVEPOINT|COMMIT|ROLLBACK|INTO)\b/i;

/**
 * Elimina literales y comentarios conservando la estructura de la sentencia.
 * Los literales se sustituyen por un espacio para no confundir palabras
 * que aparezcan dentro de un texto (por ejemplo, un producto llamado "SET").
 */
function stripLiteralsAndComments(sql) {
  let output = '';
  let index = 0;
  const length = sql.length;

  while (index < length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === "'" || char === '"') {
      const quote = char;
      index += 1;
      while (index < length) {
        if (sql[index] === quote) {
          if (sql[index + 1] === quote) {
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        index += 1;
      }
      output += ' ';
      continue;
    }

    if (char === '-' && next === '-') {
      while (index < length && sql[index] !== '\n') index += 1;
      output += '\n';
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < length && !(sql[index] === '*' && sql[index + 1] === '/')) {
        index += 1;
      }
      index += 2;
      output += ' ';
      continue;
    }

    output += char;
    index += 1;
  }

  return output;
}

function assertReadOnlySql(sql) {
  if (typeof sql !== 'string' || !sql.trim()) {
    throw new SqlGuardError('SQL vacio');
  }

  if (sql.length > 20000) {
    throw new SqlGuardError('SQL demasiado largo');
  }

  const cleaned = stripLiteralsAndComments(sql).trim();
  const withoutTrailingSemicolon = cleaned.replace(/;\s*$/, '');

  if (withoutTrailingSemicolon.includes(';')) {
    throw new SqlGuardError('Multiples sentencias SQL bloqueadas');
  }

  if (!/^(SELECT|WITH|VALUES)\b/i.test(withoutTrailingSemicolon)) {
    throw new SqlGuardError('Solo se permiten lecturas SELECT/WITH/VALUES');
  }

  const forbidden = withoutTrailingSemicolon.match(WRITE_KEYWORDS);
  if (forbidden) {
    throw new SqlGuardError(`Palabra SQL bloqueada: ${forbidden[1]}`);
  }

  return true;
}

function runWithReadOnly(meta, callback) {
  return storage.run(
    {
      readOnly: true,
      tool: meta && meta.tool ? String(meta.tool) : 'unknown',
      codigoCliente: meta && meta.codigoCliente ? String(meta.codigoCliente) : null,
    },
    callback,
  );
}

function getContext() {
  return storage.getStore() || null;
}

function isReadOnlyContext() {
  const context = getContext();
  return Boolean(context && context.readOnly);
}

module.exports = {
  SqlGuardError,
  assertReadOnlySql,
  runWithReadOnly,
  getContext,
  isReadOnlyContext,
  stripLiteralsAndComments,
};
