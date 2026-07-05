import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
}
