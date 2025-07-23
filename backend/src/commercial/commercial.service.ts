import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommercialDto } from './dto/create-commercial.dto';
import { UpdateCommercialDto } from './dto/update-commercial.dto';

@Injectable()
export class CommercialService {
  constructor(private prisma: PrismaService) {}

  create(createCommercialDto: CreateCommercialDto) {
    const { equipeId, ...otherData } = createCommercialDto;
    return this.prisma.commercial.create({
      data: {
        ...otherData,
        equipe: {
          connect: { id: equipeId },
        },
      },
    });
  }

  findAll() {
    return this.prisma.commercial.findMany({
      include: {
        equipe: {
          include: {
            manager: true,
          },
        },
        historiques: true, // Include historiques to sum contracts
      },
    });
  }

  findOne(id: string) {
    return this.prisma.commercial.findUnique({
      where: { id },
      include: { equipe: { include: { manager: true } } },
    });
  }

  update(id: string, updateCommercialDto: UpdateCommercialDto) {
    const { equipeId, ...otherData } = updateCommercialDto;
    return this.prisma.commercial.update({
      where: { id },
      data: {
        ...otherData,
        ...(equipeId && {
          equipe: { connect: { id: equipeId } },
        }),
      },
    });
  }

  remove(id: string) {
    return this.prisma.commercial.delete({ where: { id } });
  }
}
