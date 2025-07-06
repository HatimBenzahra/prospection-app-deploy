import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommercialDto } from './dto/create-commercial.dto';
import { UpdateCommercialDto } from './dto/update-commercial.dto';

@Injectable()
export class CommercialService {
  constructor(private prisma: PrismaService) {}

  create(createCommercialDto: CreateCommercialDto) {
    return this.prisma.commercial.create({ data: createCommercialDto });
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
    return this.prisma.commercial.update({
      where: { id },
      data: updateCommercialDto,
    });
  }

  remove(id: string) {
    return this.prisma.commercial.delete({ where: { id } });
  }
}
