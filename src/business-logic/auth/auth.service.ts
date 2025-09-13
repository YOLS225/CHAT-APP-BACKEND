import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { compare } from 'bcrypt';
import { failAction, successAction } from '../../utils/action.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  async login(authDto: AuthDto) {
    const recoveredUser = await this.prisma.user.findUnique({
      where: {
        email: authDto.email,
      },
    });

    if (!recoveredUser) {
      return failAction(null, false, 'email inexistant or incorrect !');
    }

    if (recoveredUser) {
      const match = await compare(authDto.password, recoveredUser.password);

      if (match) {
        return successAction(
          recoveredUser,
          true,
          'Authentification successful !',
        );
      } else {
        return failAction(null, false, 'password incorrect !');
      }
    }
  }
}
