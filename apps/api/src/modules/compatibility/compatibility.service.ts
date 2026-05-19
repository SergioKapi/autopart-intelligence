import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompatibilityService {
  constructor(private prisma: PrismaService) {}

  async getEquivalents(partId: string) {
    const equivalences = await this.prisma.partEquivalence.findMany({
      where: { OR: [{ partAId: partId }, { partBId: partId }] },
      include: {
        partA: { include: { manufacturer: true } },
        partB: { include: { manufacturer: true } },
      },
    });
    return equivalences.map((eq) => (eq.partAId === partId ? eq.partB : eq.partA));
  }

  async addCompatibility(partId: string, versionId: string, position: string) {
    return this.prisma.vehicleCompatibility.create({
      data: { partId, versionId, position: position as any },
    });
  }

  async addEquivalence(partAId: string, partBId: string, verified = false) {
    return this.prisma.partEquivalence.create({
      data: { partAId, partBId, verified },
    });
  }
}
