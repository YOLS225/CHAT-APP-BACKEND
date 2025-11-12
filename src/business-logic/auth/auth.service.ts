import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { compare } from 'bcrypt';
import { failAction, successAction } from '../../utils/action.dto';
import {
  signJwt,
  signRefreshJwt,
  verifyRefreshJwt,
} from '../../guard/jwt.strategy';

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

          // Génération des tokens
          const accessToken = signJwt(payload);
          const refreshToken = signRefreshJwt({ sub: recoveredUser.id });

          const data = {
            token: accessToken,
            refreshToken: refreshToken,
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

  async refreshToken(refreshToken: string) {
    try {
      // 1. Vérifier que le refresh token est valide
      const decoded = verifyRefreshJwt(refreshToken);

      if (!decoded || !decoded.sub) {
        return failAction(null, false, 'Invalid or expired refresh token');
      }

      // 2. Récupérer l'utilisateur de la base de données
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        return failAction(null, false, 'User not found');
      }

      // 3. Vérifier que l'utilisateur est toujours actif
      if (user.status !== 'ACTIVE') {
        return failAction(null, false, 'User is not active');
      }

      // 4. Générer un NOUVEAU access token
      const payload = {
        sub: user.id,
        email: user.email,
        userName: user.userName,
      };

      const newAccessToken = signJwt(payload);
      const newRefreshToken = signRefreshJwt({ sub: payload.sub });

      // 5. Retourner le nouveau access token
      const data = {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };

      return successAction(data, true, 'Token refreshed successfully');
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during token refresh: ${e}`);
    }
  }
}
