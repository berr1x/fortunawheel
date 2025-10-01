import { EmailQueueService } from '../services/email-queue.service';
import { SendsayService } from '../services/sendsay.service';
export declare class EmailProcessor {
    private emailQueueService;
    private sendsayService;
    constructor(emailQueueService: EmailQueueService, sendsayService: SendsayService);
    handleEmail(job: any): Promise<void>;
}
