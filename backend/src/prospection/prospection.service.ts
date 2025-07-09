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
      // Connect the commercial to the immeuble as a prospector
      await this.prisma.immeuble.update({
        where: { id: immeubleId },
        data: {
          prospectors: {
            connect: { id: commercialId },
          },
        },
      });
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
      const newRequest = await this.prisma.prospectionRequest.create({
        data: {
          immeubleId,
          requesterId: commercialId,
          partnerId,
          status: 'PENDING',
        },
      });

      // Send email notification to partner
      await this.sendEmail(partner.email, 'Prospection Invitation', `You have been invited to a duo prospection for immeuble ${immeuble.adresse}.`);

      return { message: 'Duo prospection invitation sent.', requestId: newRequest.id };
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
      console.log(`Request ${requestId} status updated to ACCEPTED.`); // Ajout de ce log
      await this.generateAndAssignPortes(
        request.immeubleId,
        [request.requesterId, request.partnerId],
        request.immeuble.nbPortesTotal,
      );
      // Connect both requester and partner to the immeuble as prospectors
      await this.prisma.immeuble.update({
        where: { id: request.immeubleId },
        data: {
          prospectors: {
            connect: [
              { id: request.requesterId },
              { id: request.partnerId },
            ],
          },
        },
      });
      return { message: 'Prospection request accepted and portes generated.', immeubleId: request.immeubleId };
    } else {
      await this.prisma.prospectionRequest.update({
        where: { id: requestId },
        data: { status: 'REFUSED' },
      });
      console.log(`Request ${requestId} status updated to REFUSED.`); // Ajout de ce log
      return { message: 'Prospection request refused.' };
    }
  }

  private async generateAndAssignPortes(immeubleId: string, commercialIds: string[], totalPortes: number) {
    const portesToCreate = [];
    if (commercialIds.length === 0) {
      throw new BadRequestException('No commercial IDs provided for door assignment.');
    }

    // Ensure there are at least two commercials for duo mode, otherwise default to solo logic
    const hostCommercialId = commercialIds[0];
    const duoCommercialId = commercialIds.length > 1 ? commercialIds[1] : null;

    const midpoint = Math.ceil(totalPortes / 2); // First half for the host

    for (let i = 0; i < totalPortes; i++) {
      const numeroPorte = `Porte ${i + 1}`;
      let assigneeId: string;

      if (duoCommercialId && i < midpoint) {
        // Assign first half to the host
        assigneeId = hostCommercialId;
      } else if (duoCommercialId && i >= midpoint) {
        // Assign second half to the duo
        assigneeId = duoCommercialId;
      } else {
        // Fallback to host if no duo or only one commercial
        assigneeId = hostCommercialId;
      }

      portesToCreate.push({
        numeroPorte: numeroPorte,
        statut: PorteStatut.NON_VISITE,
        passage: 0,
        immeubleId: immeubleId,
        assigneeId: assigneeId,
      });
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

  async getPendingRequestsForCommercial(commercialId: string) {
    return this.prisma.prospectionRequest.findMany({
      where: {
        partnerId: commercialId,
        status: 'PENDING',
      },
      include: {
        immeuble: { select: { adresse: true, ville: true, codePostal: true } },
        requester: { select: { nom: true, prenom: true } },
      },
    });
  }

  async getRequestStatus(requestId: string) {
    const result = await this.prisma.prospectionRequest.findUnique({
      where: { id: requestId },
      select: { status: true },
    });
    console.log(`Backend getRequestStatus for ${requestId}:`, result);
    return result;
  }
}