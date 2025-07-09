import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartProspectionDto } from './dto/start-prospection.dto';
import { HandleProspectionRequestDto } from './dto/handle-prospection-request.dto';
import { PorteStatut, ProspectingMode } from '@prisma/client';

@Injectable()
export class ProspectionService {
  constructor(private prisma: PrismaService) {}

  async startProspection(dto: StartProspectionDto) {
    const { commercialId, immeubleId, mode, partnerId } = dto;

    const immeuble = await this.prisma.immeuble.findUnique({
      where: { id: immeubleId },
      include: { portes: true, prospectors: true },
    });

    if (!immeuble) {
      throw new NotFoundException(`Immeuble with ID ${immeubleId} not found.`);
    }

    if (immeuble.portes.length > 0) {
      throw new BadRequestException('Portes for this immeuble have already been generated.');
    }

    if (mode === ProspectingMode.SOLO) {
      await this.generateAndAssignPortes(immeubleId, [commercialId], immeuble.nbPortesTotal);
      return { message: 'Solo prospection started and portes generated.' };
    } else if (mode === ProspectingMode.DUO) {
      if (!partnerId) {
        throw new BadRequestException('Partner ID is required for DUO mode.');
      }

      // Check if partner exists and is in the same team
      const requester = await this.prisma.commercial.findUnique({ where: { id: commercialId } });
      const partner = await this.prisma.commercial.findUnique({ where: { id: partnerId } });

      if (!requester || !partner || requester.equipeId !== partner.equipeId) {
        throw new BadRequestException('Invalid partner or partner not in the same team.');
      }

      // Create a prospection request
      await this.prisma.prospectionRequest.create({
        data: {
          immeubleId,
          requesterId: commercialId,
          partnerId,
          status: 'PENDING',
        },
      });

      // Send email notification to partner
      await this.sendEmail(partner.email, 'Prospection Invitation', `You have been invited to a duo prospection for immeuble ${immeuble.adresse}.`);

      return { message: 'Duo prospection invitation sent.' };
    }
  }

  async handleProspectionRequest(dto: HandleProspectionRequestDto) {
    const { requestId, accept } = dto;

    const request = await this.prisma.prospectionRequest.findUnique({
      where: { id: requestId },
      include: { immeuble: true },
    });

    if (!request || request.status !== 'PENDING') {
      throw new NotFoundException('Prospection request not found or already handled.');
    }

    if (accept) {
      await this.prisma.prospectionRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });
      await this.generateAndAssignPortes(
        request.immeubleId,
        [request.requesterId, request.partnerId],
        request.immeuble.nbPortesTotal,
      );
      return { message: 'Prospection request accepted and portes generated.' };
    } else {
      await this.prisma.prospectionRequest.update({
        where: { id: requestId },
        data: { status: 'REFUSED' },
      });
      return { message: 'Prospection request refused.' };
    }
  }

  private async generateAndAssignPortes(immeubleId: string, commercialIds: string[], totalPortes: number) {
    const portesToCreate = [];
    const portesPerCommercial = Math.floor(totalPortes / commercialIds.length);
    let currentPorteNumber = 1;

    for (let i = 0; i < commercialIds.length; i++) {
      const commercialId = commercialIds[i];
      const numPortes = (i === commercialIds.length - 1) ? (totalPortes - portesToCreate.length) : portesPerCommercial; // Assign remaining portes to the last commercial

      for (let j = 0; j < numPortes; j++) {
        portesToCreate.push({
          numeroPorte: `Porte ${currentPorteNumber++}`,
          statut: PorteStatut.NON_VISITE,
          passage: 0,
          immeubleId: immeubleId,
          assigneeId: commercialId,
        });
      }
    }

    await this.prisma.porte.createMany({
      data: portesToCreate,
    });
  }

  private async sendEmail(to: string, subject: string, text: string) {
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    // In a real application, use a library like nodemailer here
  }

  async getAllProspectionRequests() {
    return this.prisma.prospectionRequest.findMany();
  }
}