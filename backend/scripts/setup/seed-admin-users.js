/**
 * Crea o actualiza los accesos iniciales del panel interno.
 *
 * Uso:
 *   ADMIN_JAVIER_PASSWORD=... ADMIN_DIEGO_PASSWORD=... \
 *   ADMIN_MARIROLA_PASSWORD=... ADMIN_MARTIN_PASSWORD=... \
 *   node scripts/setup/seed-admin-users.js
 *
 * No imprime contraseñas ni hashes. Las sesiones existentes se revocan para
 * obligar a entrar con la contraseña nueva.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.production') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const odbc = require('odbc');

const connectionString =
  process.env.ODBC_CONNECTION_STRING;

const accounts = [
  {
    email: 'javier@mari-pepa.com',
    name: 'Javier Lacal',
    password: process.env.ADMIN_JAVIER_PASSWORD,
  },
  {
    email: 'diego@mari-pepa.com',
    name: 'Diego Corbalán',
    password: process.env.ADMIN_DIEGO_PASSWORD,
  },
  {
    email: 'marirola@mari-pepa.com',
    name: 'Marirola García',
    password: process.env.ADMIN_MARIROLA_PASSWORD,
  },
  {
    email: 'martin@mari-pepa.com',
    name: 'Martín',
    password: process.env.ADMIN_MARTIN_PASSWORD,
  },
];

async function main() {
  for (const account of accounts) {
    if (!account.password || account.password.length < 10) {
      throw new Error(`Falta una contraseña válida para ${account.email}`);
    }
  }

  const connection = await odbc.connect(connectionString);
  try {
    for (const account of accounts) {
      const email = account.email.toLowerCase();
      const existing = await connection.query(
        'SELECT TRIM(ID) AS ID FROM JAVIER.ADMIN_USERS WHERE LOWER(EMAIL) = ?',
        [email],
      );
      const hash = await bcrypt.hash(account.password, 12);
      let action = 'updated';

      if (existing.length) {
        const id = String(existing[0].ID).trim();
        await connection.query(
          `UPDATE JAVIER.ADMIN_USERS
              SET NAME = ?, EMAIL = ?, ROLE = 'admin', PASSWORD_HASH = ?,
                  STATUS = 'active', ACTIVE = 1, DELETED_AT = NULL,
                  UPDATED_AT = CURRENT TIMESTAMP
            WHERE ID = ?`,
          [account.name, email, hash, id],
        );
        await connection.query(
          'UPDATE JAVIER.ADMIN_SESSIONS SET ACTIVE = 0 WHERE USER_ID = ?',
          [id],
        );
      } else {
        action = 'created';
        const id = `team-${crypto.randomUUID()}`;
        await connection.query(
          `INSERT INTO JAVIER.ADMIN_USERS
            (ID, EMAIL, NAME, ROLE, PASSWORD_HASH, STATUS, ACTIVE)
           VALUES (?,?,?,?,?,'active',1)`,
          [id, email, account.name, 'admin', hash],
        );
      }

      const verify = await connection.query(
        'SELECT PASSWORD_HASH FROM JAVIER.ADMIN_USERS WHERE LOWER(EMAIL) = ? AND ACTIVE = 1',
        [email],
      );
      const valid = await bcrypt.compare(
        account.password,
        String(verify[0].PASSWORD_HASH),
      );
      if (!valid) throw new Error(`No se pudo verificar ${email}`);

      await connection.query(
        `INSERT INTO JAVIER.ADMIN_ACTIVITY
          (ID, KIND, ENTITY, DETAIL, USER_EMAIL, USER_NAME, ACTIVE)
         VALUES (?, 'create', 'Equipo', ?, ?, ?, 1)`,
        [
          `act-${crypto.randomUUID()}`,
          action === 'created'
            ? `Acceso administrador creado para ${account.name}`
            : `Acceso administrador actualizado para ${account.name}`,
          email,
          account.name,
        ],
      );

      console.log(`${action.toUpperCase()} ${account.name} <${email}>`);
    }
  } finally {
    await connection.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('ERROR', error.message || error);
    process.exit(1);
  });
