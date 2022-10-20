import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Magic } from 'magic-admin-esm';

@Injectable()
export class MagicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    try {
      const isFormattedCorrectly = req.headers.authorization
        ?.toLowerCase()
        .startsWith('bearer ');

      if (!req.headers.authorization) {
        throw new BadRequestException({
          message: 'Missing authorization header.',
        });
      }
      if (!isFormattedCorrectly) {
        throw new BadRequestException({
          message:
            'Malformed authorization header. Please use the `Bearer ${token}` format.',
        });
      }

      const didToken = req.headers.authorization?.substring(7);
      const magicInstance = new Magic(process.env.MAGIC_SECRET_KEY);

      magicInstance.token.validate(didToken);
      const user = {
        issuer: magicInstance.token.getIssuer(didToken),
        publicAddress: magicInstance.token.getPublicAddress(didToken),
        claim: magicInstance.token.decode(didToken)[1],
      };
      // const userMetadata = await magicInstance.users.getMetadataByIssuer(
      //   userIssuer,
      // );

      req.user = user;
      return true;
    } catch (err) {
      if (err)
        throw new UnauthorizedException({
          message: err.message,
          error_code: err.code,
        });
      throw new UnauthorizedException({ message: 'Invalid DID token.' });
    }
  }
}
