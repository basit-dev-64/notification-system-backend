import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { JwtService } from 'src/services/jwt/jwt.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) {}

    async signup(input: SignupDto): Promise<any> {
        try {
            const { email, password, fname, lname, designation } = input;
            const passwordHash = await bcrypt.hash(password, 10); 
            const existingUser = await this.userModel.findOne({ email });
            if (existingUser) {
                throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
            }
            const user = await this.userModel.create({ email, password: passwordHash, fname, lname, designation });
            if (!user) {
                throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const token = await this.jwtService.generateToken({ email: user.email, id: user._id.toString() });
            return {
                message: 'Signup successful',
                user: {
                    email: user.email,
                    fname: user.fname,
                    lname: user.lname,
                    designation: user.designation,
                },
                token,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async login(input: LoginDto): Promise<any> {
        try {
            const { email, password } = input;
            const user = await this.userModel.findOne({ email });
            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
            }
            const token = await this.jwtService.generateToken({ email: user.email, id: user._id.toString() });
            return {
                message: 'Login successful',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    fname: user.fname,
                    lname: user.lname,
                    designation: user.designation,
                },
                token,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
