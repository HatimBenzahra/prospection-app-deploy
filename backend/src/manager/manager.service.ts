import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  create(createManagerDto: CreateManagerDto) {
    return this.prisma.$transaction(async (prisma) => {
      const manager = await prisma.manager.create({ data: createManagerDto });
      await prisma.equipe.create({
        data: {
          nom: `Équipe de ${manager.prenom}`,
          managerId: manager.id,
        },
      });
      return manager;
    });
  }

  findAll() {
    return this.prisma.manager.findMany({
      include: {
        equipes: {
          include: {
            commerciaux: {
              include: {
                historiques: true,
              },
            },
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.manager.findUnique({
      where: { id },
      include: { equipes: { include: { commerciaux: true } } },
    });
  }

  update(id: string, updateManagerDto: UpdateManagerDto) {
    return this.prisma.manager.update({
      where: { id },
      data: updateManagerDto,
    });
  }

  remove(id: string) {
    return this.prisma.manager.delete({ where: { id } });
  }
}
