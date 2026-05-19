import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type SearchType = 'partnumber' | 'vehicle' | 'text';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, type: SearchType = 'text', page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    if (type === 'partnumber') {
      return this.searchByPartNumber(q, skip, limit);
    }
    return this.searchByText(q, skip, limit);
  }

  private async searchByPartNumber(q: string, skip: number, take: number) {
    const normalized = q.trim().toUpperCase();
    const [data, total] = await this.prisma.$transaction([
      this.prisma.part.findMany({
        where: {
          OR: [
            { partNumber: { equals: normalized, mode: 'insensitive' } },
            { oemCode: { equals: normalized, mode: 'insensitive' } },
            { altCodes: { has: normalized } },
          ],
          status: 'ACTIVE',
        },
        include: {
          manufacturer: true,
          category: true,
          media: { where: { isPrimary: true }, take: 1 },
        },
        skip,
        take,
      }),
      this.prisma.part.count({
        where: {
          OR: [
            { partNumber: { equals: normalized, mode: 'insensitive' } },
            { oemCode: { equals: normalized, mode: 'insensitive' } },
            { altCodes: { has: normalized } },
          ],
          status: 'ACTIVE',
        },
      }),
    ]);
    return { data, total, page: Math.floor(skip / take) + 1, limit: take };
  }

  private async searchByText(q: string, skip: number, take: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.part.findMany({
        where: {
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { technicalDesc: { contains: q, mode: 'insensitive' } },
            { partNumber: { contains: q, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
        include: {
          manufacturer: true,
          category: true,
          media: { where: { isPrimary: true }, take: 1 },
        },
        skip,
        take,
      }),
      this.prisma.part.count({
        where: {
          OR: [
            { description: { contains: q, mode: 'insensitive' } },
            { technicalDesc: { contains: q, mode: 'insensitive' } },
            { partNumber: { contains: q, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
        },
      }),
    ]);
    return { data, total, page: Math.floor(skip / take) + 1, limit: take };
  }
}
