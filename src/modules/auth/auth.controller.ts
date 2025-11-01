import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async signup(@Body(new ValidationPipe()) input: SignupDto): Promise<any> {
        return this.authService.signup(input);
    }
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body(new ValidationPipe()) input: LoginDto): Promise<any> {
        return this.authService.login(input);
    }
}


