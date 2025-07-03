import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipeDto } from './dto/create-equipe.dto';
import { UpdateEquipeDto } from './dto/update-equipe.dto';

@Injectable()
export class EquipeService {
  constructor(private prisma: PrismaService) {}

  create(createEquipeDto: CreateEquipeDto) {
    return this.prisma.equipe.create({ data: createEquipeDto });
  }

  findAll() {
    return this.prisma.equipe.findMany({ include: { manager: true } });
  }

  findOne(id: string) {
    return this.prisma.equipe.findUnique({ where: { id }, include: { manager: true, commerciaux: true } });
  }

  update(id: string, updateEquipeDto: UpdateEquipeDto) {
    return this.prisma.equipe.update({ where: { id }, data: updateEquipeDto });
  }

  remove(id: string) {
    return this.prisma.equipe.delete({ where: { id } });
  }
}
