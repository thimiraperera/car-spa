const express = require('express');
const { query, queryOne } = require('../../lib/db');

const router = express.Router();

const PER_CHOICES = [10, 25, 50, 100];
const STATUSES = ['new', 'awaiting_payment', 'paid', 'processing', 'completed', 'cancelled'];
const STATUS_LABELS = {
  new: 'New',
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled'
};
const PAYMENT_LABELS = { cod: 'COD', bank: 'Bank transfer' };

router.get('/', async function (req, res, next) {
  try {
    req.session.adminPerPage = req.session.adminPerPage || {};
    const chosen = parseInt(req.query.per, 10);
    if (PER_CHOICES.indexOf(chosen) !== -1) req.session.adminPerPage.orders = chosen;
    const perPage = PER_CHOICES.indexOf(req.session.adminPerPage.orders) !== -1
      ? req.session.adminPerPage.orders
      : 10;

    const status = STATUSES.indexOf(req.query.status) !== -1 ? req.query.status : '';
    const where = status ? ' WHERE o.status = ?' : '';
    const whereParams = status ? [status] : [];

    let page = parseInt(req.query.page, 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    const totalRow = await queryOne('SELECT COUNT(*) AS n FROM orders o' + where, whereParams);
    const total = totalRow ? totalRow.n : 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;

    // Item counts ride along on a grouped subquery so the list stays one query.
    const orders = await query(
      'SELECT o.*, COALESCE(i.items_qty, 0) AS items_qty FROM orders o ' +
      'LEFT JOIN (SELECT order_id, SUM(qty) AS items_qty FROM order_items GROUP BY order_id) i ' +
      'ON i.order_id = o.id' + where +
      ' ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?',
      whereParams.concat([perPage, (page - 1) * perPage])
    );
    res.render('admin/orders/list', {
      pageTitle: 'Orders', active: 'orders', orders,
      currentPage: page, totalPages, perPage, perChoices: PER_CHOICES,
      status, statuses: STATUSES, statusLabels: STATUS_LABELS, paymentLabels: PAYMENT_LABELS
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const order = Number.isFinite(id)
      ? await queryOne('SELECT * FROM orders WHERE id = ?', [id])
      : null;
    if (!order) return res.status(404).send('Order not found');
    const items = await query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [id]);
    res.render('admin/orders/detail', {
      pageTitle: 'Order CS-' + (1000 + order.id), active: 'orders', order, items,
      statuses: STATUSES, statusLabels: STATUS_LABELS, paymentLabels: PAYMENT_LABELS
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/status', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const order = Number.isFinite(id)
      ? await queryOne('SELECT id FROM orders WHERE id = ?', [id])
      : null;
    if (!order) return res.status(404).send('Order not found');
    const status = String(req.body.status || '');
    if (STATUSES.indexOf(status) === -1) return res.status(422).send('Unknown status');
    await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.redirect('/admin/orders/' + id + '?saved=1');
  } catch (err) {
    next(err);
  }
});

// order_items rows go with the order via ON DELETE CASCADE.
router.post('/:id/delete', async function (req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isFinite(id)) await query('DELETE FROM orders WHERE id = ?', [id]);
    res.redirect('/admin/orders?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
