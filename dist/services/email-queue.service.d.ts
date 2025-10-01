import { Queue } from 'bull';
export declare class EmailQueueService {
    private emailQueue;
    constructor(emailQueue: Queue);
    addEmailJob(userId: number, spinResultId: number, delay?: number): Promise<void>;
    processEmailJob(job: any): Promise<void>;
}
