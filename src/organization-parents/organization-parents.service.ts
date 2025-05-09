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
    if( !name ) throw new BadRequestException( "Organization parent name is required" );
    if( !acronym ) throw new BadRequestException( "Organization parent acronym is required" );
    if( !icon ) throw new BadRequestException( "Organization parent icon file path is required" );
    if( await this.findOneByName( name ) )
      throw new BadRequestException( "Duplicate organization parent name found" )
    if( await this.findOneByAcronym( acronym ) )
      throw new BadRequestException( "Duplicate organization parent acronym found" )

    try {
      const createdOrganization = this.prisma.organizationChild.create({
        data: {
          ...createOrganizationParentDto,
          facebook: facebook || null,
          instagram: instagram || null,
          twitter: twitter || null,
          linkedin: linkedin || null
        },
      });
      return createdOrganization;
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

  update(id: number, updateOrganizationParentDto: UpdateOrganizationParentDto) {
    return `This action updates a #${id} organizationParent`;
  }

  remove(id: number) {
    return `This action removes a #${id} organizationParent`;
  }
}
