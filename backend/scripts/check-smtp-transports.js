require('dotenv').config();
const nodemailer = require('nodemailer');

const configs = [
  {
    name: 'main',
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  },
  {
    name: 'rrhh',
    host: process.env.SMTP_RRHH_HOST,
    port: Number(process.env.SMTP_RRHH_PORT || 465),
    secure: String(process.env.SMTP_RRHH_SECURE || 'true') === 'true',
    auth: { user: process.env.SMTP_RRHH_USER, pass: process.env.SMTP_RRHH_PASSWORD },
  },
];

(async () => {
  for (const { name, ...cfg } of configs) {
    if (!cfg.host || !cfg.auth.user || !cfg.auth.pass) {
      console.log(name, 'NOT_CONFIGURED');
      continue;
    }
    try {
      const transport = nodemailer.createTransport(cfg);
      await transport.verify();
      console.log(name, 'VERIFY_OK');
      transport.close();
    } catch (error) {
      console.log(name, 'VERIFY_FAIL', error.code || '', String(error.message).slice(0, 90));
    }
  }
})();
