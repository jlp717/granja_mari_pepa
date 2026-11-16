/**
 * RUTAS DE ADMINISTRACIÓN Y CONTENIDO PÚBLICO
 * ==========================================
 * /api/admin/*  → panel interno (red interna + sesión)
 * /api/public/* → ofertas, revistas y candidaturas de la web
 */

const express = require('express');
const controller = require('../controllers/adminController');
const { requireInternalNetwork } = require('../middleware/adminNetwork');
const {
  contactLimiter,
  publicFormLimiter,
  pdfLimiter,
} = require('../middleware/rateLimiter');

const adminRouter = express.Router();
const publicRouter = express.Router();

adminRouter.use(requireInternalNetwork);
adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  next();
});

adminRouter.get('/health', controller.health);
adminRouter.get('/session', controller.session);
adminRouter.post('/login', controller.login);

adminRouter.use(controller.requireSession);

adminRouter.post('/logout', controller.logout);
adminRouter.get('/bootstrap', controller.bootstrap);
adminRouter.get('/events', controller.adminEvents);
adminRouter.get('/sessions', controller.sessions);
adminRouter.delete('/sessions/:token', controller.revokeSession);
adminRouter.delete('/sessions', controller.revokeOtherSessions);
adminRouter.get('/cv/:file', controller.downloadCv);

adminRouter.post('/jobs', controller.createJob);
adminRouter.put('/jobs/:id', controller.updateJob);
adminRouter.post('/jobs/:id/status', controller.jobStatus);
adminRouter.post('/jobs/:id/duplicate', controller.duplicateJob);
adminRouter.delete('/jobs/:id', controller.deleteJob);

adminRouter.post('/magazines', controller.createMagazine);
adminRouter.put('/magazines/:id', controller.updateMagazine);
adminRouter.post('/magazines/:id/status', controller.magazineStatus);
adminRouter.delete('/magazines/:id', controller.deleteMagazine);

adminRouter.put('/applications/:id', controller.updateApplication);
adminRouter.delete('/applications/:id', controller.deleteApplication);

adminRouter.post('/team', controller.requireAdmin, controller.inviteMember);
adminRouter.post('/team/:id/resend', controller.requireAdmin, controller.resendInvite);
adminRouter.delete('/team/:id', controller.requireAdmin, controller.revokeMember);

adminRouter.put('/settings', controller.requireAdmin, controller.saveSettings);
adminRouter.post('/account/password', controller.changePassword);

adminRouter.post(
  '/uploads',
  express.raw({ type: ['application/pdf', 'image/*'], limit: '25mb' }),
  controller.upload,
);

publicRouter.get('/jobs', controller.publicJobs);
publicRouter.get('/jobs/:slug', controller.publicJob);
publicRouter.get('/magazines', controller.publicMagazines);
publicRouter.get('/events', controller.publicEvents);
publicRouter.post('/applications', publicFormLimiter, controller.publicApplication);
publicRouter.post('/contact', contactLimiter, controller.publicContact);
publicRouter.post(
  '/cv',
  pdfLimiter,
  express.raw({ type: ['application/pdf'], limit: '10mb' }),
  controller.publicCv,
);

module.exports = { adminRouter, publicRouter };
