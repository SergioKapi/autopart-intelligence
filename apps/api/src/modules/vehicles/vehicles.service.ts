import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  getBrands() {
    return this.prisma.vehicleBrand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  getModelsByBrand(brandId: string) {
    return this.prisma.vehicleModel.findMany({
      where: { brandId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  getVersionsByModel(modelId: string) {
    return this.prisma.vehicleVersion.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ yearStart: 'asc' }, { engine: 'asc' }],
    });
  }

  getCompatibleParts(versionId: string) {
    return this.prisma.vehicleCompatibility.findMany({
      where: { versionId },
      include: {
        part: { include: { manufacturer: true, category: true, media: { where: { isPrimary: true }, take: 1 } } },
      },
    });
  }
}
