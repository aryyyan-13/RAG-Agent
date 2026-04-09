import express from 'express';
import { query } from '../services/database.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Get all domains for the authenticated user
 */
router.get(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const result = await query(
      'SELECT * FROM domains WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  })
);

/**
 * Create a new domain
 */
router.post(
  '/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Domain name is required' });
    }

    const result = await query(
      'INSERT INTO domains (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description || '', req.userId]
    );

    res.status(201).json(result.rows[0]);
  })
);

/**
 * Get single domain with stats
 */
router.get(
  '/:domainId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;

    const domainResult = await query(
      'SELECT * FROM domains WHERE id = $1 AND user_id = $2',
      [domainId, req.userId]
    );

    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const domain = domainResult.rows[0];

    // Get stats
    const statsResult = await query(
      `SELECT 
        COUNT(d.id) as total_documents,
        COUNT(q.id) as total_queries
       FROM documents d
       LEFT JOIN queries q ON q.domain_id = d.domain_id
       WHERE d.domain_id = $1`,
      [domainId]
    );

    res.json({
      ...domain,
      stats: statsResult.rows[0],
    });
  })
);

/**
 * Update domain
 */
router.patch(
  '/:domainId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;
    const { name, description } = req.body;

    // Verify ownership
    const ownerResult = await query(
      'SELECT user_id FROM domains WHERE id = $1',
      [domainId]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (ownerResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(domainId);

    if (updateFields.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const result = await query(
      `UPDATE domains SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  })
);

/**
 * Delete domain (cascade delete documents and chunks)
 */
router.delete(
  '/:domainId',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;

    // Verify ownership
    const ownerResult = await query(
      'SELECT user_id FROM domains WHERE id = $1',
      [domainId]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (ownerResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await query('DELETE FROM domains WHERE id = $1', [domainId]);

    res.json({ message: 'Domain deleted successfully' });
  })
);

/**
 * Get domain statistics
 */
router.get(
  '/:domainId/stats',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { domainId } = req.params;

    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM documents WHERE domain_id = $1) as total_documents,
        (SELECT COUNT(*) FROM document_chunks WHERE document_id IN 
          (SELECT id FROM documents WHERE domain_id = $1)) as total_chunks,
        (SELECT COUNT(*) FROM queries WHERE domain_id = $1) as total_queries,
        (SELECT AVG(confidence_score) FROM queries WHERE domain_id = $1) as avg_confidence,
        (SELECT MAX(created_at) FROM documents WHERE domain_id = $1) as last_upload
      `,
      [domainId]
    );

    if (!statsResult.rows[0]) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json(statsResult.rows[0]);
  })
);

export default router;
