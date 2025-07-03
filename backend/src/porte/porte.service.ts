import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePorteDto } from './dto/create-porte.dto';
import { UpdatePorteDto } from './dto/update-porte.dto';

@Injectable()
export class PorteService {
  constructor(private prisma: PrismaService) {}

  create(createPorteDto: CreatePorteDto) {
    return this.prisma.porte.create({ data: createPorteDto });
  }

  findAll() {
    return this.prisma.porte.findMany();
  }

  findOne(id: string) {
    return this.prisma.porte.findUnique({ where: { id } });
  }

  update(id: string, updatePorteDto: UpdatePorteDto) {
    return this.prisma.porte.update({ where: { id }, data: updatePorteDto });
  }

  remove(id: string) {
    return this.prisma.porte.delete({ where: { id } });
  }
}
