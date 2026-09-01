import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

const defaultSettings = {
  taxTolerance: 1,
  invoiceValueTolerance: 1,
  dateTolerance: 0,
  fuzzyMatchThreshold: 90
};

// Get all settings
router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findMany();
    const settingsMap: Record<string, any> = {};

    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    // Merge with defaults
    const merged = { ...defaultSettings, ...settingsMap };
    res.json(merged);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await prisma.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export { router as settingsRoutes };
