import { Request, Response } from 'express';
import { MongoDBAdapter } from '../adapters/MongoDBAdapter';
import { assertProjectAccess, assertCollectionOperation } from '../utils/projectAuth';
import logger from '../utils/logger';
import { z } from 'zod';

const adapter = new MongoDBAdapter();

const insertDataSchema = z.object({
  entity: z.string().min(1),
  records: z.array(z.record(z.unknown())).min(1),
});

export const insertData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;

    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required' });
      return;
    }

    const { entity, records } = insertDataSchema.parse(req.body);

    // 1. Verify project access
    const project = await assertProjectAccess(userId, projectId);

    // 2. Verify collection allowed operations
    assertCollectionOperation(project, entity, 'create');

    // 3. Process default IDs and fields for records
    const processed = records.map((record) => {
      const data = { ...record };
      const ent = entity.toLowerCase();
      if (ent === 'products') {
        if (!data.productId) data.productId = `PROD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
        if (!data.sku) data.sku = `SKU-${Date.now().toString().slice(-6)}`;
        if (!data.subcategory) data.subcategory = 'General';
        if (!data.costPrice && typeof data.price === 'number') data.costPrice = Math.round((data.price as number) * 0.7);
        if (data.isActive === undefined) data.isActive = true;
        if (!data.unit) data.unit = 'piece';
      } else if (ent === 'customers') {
        if (!data.customerId) data.customerId = `CUST-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
        if (!data.city) data.city = 'Mumbai';
        if (!data.state) data.state = 'Maharashtra';
        if (!data.phone) data.phone = '+91-9876543210';
        if (!data.segment) data.segment = 'retail';
        if (data.isActive === undefined) data.isActive = true;
      } else if (ent === 'orders') {
        if (!data.orderId) data.orderId = `ORD-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
        if (!data.region) data.region = 'Central';
        if (!data.city) data.city = 'Delhi';
        if (!data.state) data.state = 'Delhi';
        if (!data.status) data.status = 'pending';
        if (!data.paymentMethod) data.paymentMethod = 'upi';
        if (!data.paymentStatus) data.paymentStatus = 'unpaid';
        if (!data.amount && data.totalAmount) data.amount = data.totalAmount;
        if (!data.totalAmount && data.amount) data.totalAmount = data.amount;
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
          data.items = [{ productId: 'PROD-001', productName: 'Item', quantity: 1, unitPrice: (data.amount as number) || 1000, totalPrice: (data.amount as number) || 1000 }];
        }
      } else if (ent === 'invoices') {
        if (!data.invoiceId) data.invoiceId = `INV-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
        if (!data.status) data.status = 'draft';
        if (!data.dueDate) data.dueDate = new Date();
        if (!data.orderId) data.orderId = 'ORD-001';
        if (!data.customerId) data.customerId = 'CUST-001';
        if (!data.customerName) data.customerName = 'General Customer';
        if (!data.amount && data.totalAmount) data.amount = data.totalAmount;
        if (!data.totalAmount && data.amount) data.totalAmount = data.amount;
      }
      return data;
    });

    const result = await adapter.bulkCreate(entity, processed, projectId, userId);

    logger.info('Direct data feed executed', {
      userId,
      projectId,
      entity,
      count: result.count,
    });

    res.status(201).json({
      success: true,
      message: `Successfully inserted ${result.count} record(s) into ${entity}`,
      count: result.count,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Invalid payload' });
      return;
    }
    logger.error('insertData error', error);
    res.status(500).json({ error: error.message || 'Failed to insert data' });
  }
};
