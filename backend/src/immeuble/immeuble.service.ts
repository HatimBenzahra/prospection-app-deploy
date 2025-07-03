import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';

@Injectable()
export class ImmeubleService {
  constructor(private prisma: PrismaService) {}

  create(createImmeubleDto: CreateImmeubleDto) {
    return this.prisma.immeuble.create({ data: createImmeubleDto });
  }

  findAll() {
    return this.prisma.immeuble.findMany({ include: { zone: true, prospectors: true } });
  }

  findOne(id: string) {
    return this.prisma.immeuble.findUnique({ where: { id }, include: { zone: true, prospectors: true, portes: true } });
  }

  update(id: string, updateImmeubleDto: UpdateImmeubleDto) {
    return this.prisma.immeuble.update({ where: { id }, data: updateImmeubleDto });
  }

  remove(id: string) {
    return this.prisma.immeuble.delete({ where: { id } });
  }
}
