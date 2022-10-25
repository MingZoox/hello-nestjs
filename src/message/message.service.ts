import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Message } from "src/common/entities/message.entity";
import { User } from "src/common/entities/user.entity";
import { UserService } from "src/user/user.service";
import { getRepository, Repository } from "typeorm";

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private userService: UserService,
  ) {}

  async create({ content, to }, currentUser: User): Promise<number> {
    const toUser = await this.userService.findOne(to);
    const createMessage: Message = this.messageRepository.create({
      content,
      from: currentUser,
      to: toUser,
    });

    return (await this.messageRepository.save(createMessage)).id;
  }

  async getInbox(toUserId: number, currentUser: User): Promise<any> {
    const messages: Message[] = await this.messageRepository.find({
      relations: {
        to: true,
        from: true,
      },
      where: {
        to: {
          id: toUserId,
        },
        from: {
          id: currentUser.id,
        },
      },
      select: {
        from: {
          id: true,
        },
      },
      order: {
        createdAt: "DESC",
      },
    });
    return messages;
  }

  async getUsersSent(currentUser: User): Promise<User[]> {
    //get distinct users sent
    const users: User[] = await this.messageRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.to", "to")
      .where("message.from = :fromId", { fromId: currentUser.id })
      .orderBy("createdAt", "ASC")
      .select("to")
      .distinct(true)
      .getRawMany();

    return users;
  }
}
