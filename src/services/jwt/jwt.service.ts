import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import configuration from 'src/configurations/configuration';

interface JwtPayload {
    email: string;
    id: string;
}
@Injectable()
export class JwtService {
    async generateToken(payload: JwtPayload): Promise<string> {
        return jwt.sign(payload, configuration().jwtSecret as string, { expiresIn: '10h' });
    }
    async verifyToken(token: string): Promise<any> {
        return jwt.verify(token, configuration().jwtSecret as string);
    }
}
