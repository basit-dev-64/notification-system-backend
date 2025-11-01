 import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "../services/jwt/jwt.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const headers = request.headers;
        const token = headers['authorization'].split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }
        try {
            const decoded = await this.jwtService.verifyToken(token);
            if (!decoded) {
                throw new UnauthorizedException('Invalid token');
            }
            // Attach decoded user info to request object
            request.user = decoded;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}