import { CreateOrganizationParentDto } from './dto/create-organization-parent.dto';
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UpdateOrganizationParentDto } from './dto/update-organization-parent.dto';

@Injectable()
export class OrganizationParentsService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}
  
  async create(createOrganizationParentDto: CreateOrganizationParentDto) {

    const { name, acronym, icon, facebook, instagram, twitter, linkedin } = createOrganizationParentDto;
    if( !name ) throw new BadRequestException( "Organization Parent name is required" );
    if( !acronym ) throw new BadRequestException( "Organization Parent acronym is required" );
    if( !icon ) throw new BadRequestException( "Organization Parent icon file path is required" );
    if( await this.findOneByName( name ) )
      throw new BadRequestException( "Duplicate organization parent name found" );
    if( await this.findOneByAcronym( acronym ) )
      throw new BadRequestException( "Duplicate organization parent acronym found" );

    try {
      const createdOrganizationParent = this.prisma.organizationParent.create({
        data: {
          ...createOrganizationParentDto,
          facebook: facebook || null,
          instagram: instagram || null,
          twitter: twitter || null,
          linkedin: linkedin || null
        },
      });
      return createdOrganizationParent;
    } catch (error) {
      throw new HttpException(
        'Failed to create organization parent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

  }

  findAll() {
    return `This action returns all organizationParents`;
  }

  findOne(id: number) {
    return `This action returns a #${id} organizationParent`;
  }

  async findOneById(id: string) {
    const organizationParent = this.prisma.organizationParent.findUnique({
      where: {
        id,
      }
    });

    return organizationParent;
  }

  findOneByAcronym(acronym: string) {
    const organizationParent = this.prisma.organizationParent.findUnique( {
      where: { acronym }
    } );
    return organizationParent;
  }

  findOneByName(name: string) {
    const organizationParent = this.prisma.organizationParent.findUnique( {
      where: { name }
    } );
    return organizationParent;
  }

  async update(id: string, updateOrganizationParentDto: UpdateOrganizationParentDto) {
    
    const { name, acronym, icon, facebook, instagram, twitter, linkedin } = updateOrganizationParentDto;
    if( !name ) throw new BadRequestException( "Organization Parent name is required" );
    if( !acronym ) throw new BadRequestException( "Organization Parent acronym is required" );
    if( !icon ) throw new BadRequestException( "Organization Parent icon file path is required" );
    if( await this.findOneByName( name ) )
      throw new BadRequestException( "Duplicate organization parent name found" );
    if( await this.findOneByAcronym( acronym ) )
      throw new BadRequestException( "Duplicate organization parent acronym found" );
    try {

      const updatedOrganizationParent = this.prisma.organizationParent.update({
        where: {
          id,
        },
        data: {
          ...updateOrganizationParentDto,
          facebook: facebook || null,
          instagram: instagram || null,
          twitter: twitter || null,
          linkedin: linkedin || null
        },
      });
      return updatedOrganizationParent;

    } catch (error) {

      throw new HttpException(
        'Failed to update organization parent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    }

  }

  async updateOrganizationParentIcon(id: string, icon: Express.Multer.File) {
    const organizationParent = await this.findOneById(id);

    if (!organizationParent) {
      throw new HttpException('Organization Parent not found', HttpStatus.NOT_FOUND);
    }

    const organizationIconFileName = `${organizationParent.name}-icon`;

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const uploadedIcon = await this.supabase.uploadFile(
          icon,
          organizationIconFileName,
          process.env.SUPABASE_BUCKET_NAME!,
        );

        if (!uploadedIcon) {
          throw new HttpException(
            'Failed to upload Organization Parent icon',
            HttpStatus.BAD_REQUEST,
          );
        }

        const retrievedIconUrl = await this.supabase.getFileUrl(
          organizationIconFileName,
          process.env.SUPABASE_BUCKET_NAME!,
        );

        if (!retrievedIconUrl) {
          throw new HttpException(
            'Failed to retrieve Organization icon',
            HttpStatus.BAD_REQUEST,
          );
        }

        const updatedOrganizationParent = await prisma.organizationParent.update({
          where: { id },
          data: { icon: retrievedIconUrl }
        });

        return updatedOrganizationParent;
      });

      return {
        message: 'Organization Parent icon updated successfully',
        organization: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update Organization Parent icon',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} organizationParent`;
  }
}
