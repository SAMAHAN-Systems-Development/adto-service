import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { Public } from 'src/auth/public.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserType } from '@prisma/client';

@Controller('registrations')
@UseGuards(AuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Public()
  @Post()
  create(@Body() createRegistrationDto: CreateRegistrationDto) {
    return this.registrationsService.create(createRegistrationDto);
  }

  @Get()
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findAll() {
    return this.registrationsService.findAll();
  }

  @Get(':id')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  findOne(@Param('id') id: string) {
    return this.registrationsService.findOne(id);
  }

  @Patch('/update/:id')
  @Roles(UserType.ADMIN, UserType.ORGANIZATION)
  update(
    @Param('id') id: string,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ) {
    return this.registrationsService.update(id, updateRegistrationDto);
  }
}
