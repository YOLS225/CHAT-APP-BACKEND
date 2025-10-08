import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { compare } from 'bcrypt';
import { failAction, successAction } from '../../utils/action.dto';
import { signJwt } from '../../guard/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(authDto: AuthDto) {
    try {
      const recoveredUser = await this.prisma.user.findUnique({
        where: {
          email: authDto.email,
        },
      });
      //Quelque chose de mal avec l'email
      if (!recoveredUser) {
        return failAction(null, false, 'email inexistant or incorrect !');
      }

      // Si l'utilisateur n'est pas actif, retourner une erreur
      if (recoveredUser.status !== 'ACTIVE') {
        return failAction(null, false, 'User is not active !');
      }

      //Verrifier le mot de passe
      if (recoveredUser) {
        const match = await compare(authDto.password, recoveredUser.password);

        if (match) {
          // Mettre à jour l'utilisateur en ligne
          await this.prisma.user.update({
            where: { id: recoveredUser.id },
            data: {
              isOnline: true,
              lastSeen: new Date(),
            },
          });
          // construction du payload JWT
          const payload = {
            sub: recoveredUser.id,
            email: recoveredUser.email,
            userName: recoveredUser.userName,
          };

          // recuperation du JWT
          const accessToken = signJwt(payload);
          const data = {
            token: accessToken,
            user: {
              id: recoveredUser.id,
              userName: recoveredUser.userName,
              email: recoveredUser.email,
              isOnline: true,
              avatar: recoveredUser.avatar,
            },
          };
          return successAction(data, true, 'Authentification successful !');
        } else {
          return failAction(null, false, 'password incorrect !');
        }
      }
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }

  async logout(id: string) {
    try {
      const recoveredUser = await this.prisma.user.findUnique({
        where: {
          id: id,
        },
      });
      if (!recoveredUser) {
        return failAction(null, false, 'User:not found !');
      }
      await this.prisma.user.update({
        where: { id: id },
        data: {
          isOnline: false,
          lastSeen: new Date(),
        },
      });
      return successAction(null, true, 'User:logout successfuly !');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
