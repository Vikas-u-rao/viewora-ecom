import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function getCollections(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(collections);
  } catch (error) {
    next(error);
  }
}
