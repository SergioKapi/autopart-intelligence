import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';

@Injectable()
export class PartsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.part.findMany({
        skip,
        take: limit,
        include: { manufacturer: true, category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.part.count(),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id },
      include: {
        manufacturer: true,
        category: true,
        media: true,
        compatibilities: { include: { version: { include: { model: { include: { brand: true } } } } } },
        equivalencesA: { include: { partB: { include: { manufacturer: true } } } },
      },
    });
    if (!part) throw new NotFoundException(`Part ${id} not found`);
    return part;
  }

  async create(dto: CreatePartDto) {
    return this.prisma.part.create({
      data: dto,
      include: { manufacturer: true, category: true },
    });
  }

  async update(id: string, dto: UpdatePartDto) {
    await this.findOne(id);
    return this.prisma.part.update({
      where: { id },
      data: dto,
      include: { manufacturer: true, category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.part.delete({ where: { id } });
  }
}
