-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchases" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "order_id" TEXT,
    "amount" INTEGER NOT NULL,
    "spins_earned" INTEGER NOT NULL,
    "customer_email" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."prizes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "quantity_remaining" INTEGER NOT NULL,
    "type" TEXT,

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spin_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "purchase_id" INTEGER NOT NULL,
    "spins_total" INTEGER NOT NULL,
    "spins_used" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spin_results" (
    "id" SERIAL NOT NULL,
    "spin_session_id" INTEGER NOT NULL,
    "prize_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "purchase_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'issued',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spin_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_queue" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "spin_result_id" INTEGER NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "send_after" TIMESTAMP(3) NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_order_id_key" ON "public"."purchases"("order_id");

-- AddForeignKey
ALTER TABLE "public"."purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spin_sessions" ADD CONSTRAINT "spin_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spin_sessions" ADD CONSTRAINT "spin_sessions_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spin_results" ADD CONSTRAINT "spin_results_spin_session_id_fkey" FOREIGN KEY ("spin_session_id") REFERENCES "public"."spin_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spin_results" ADD CONSTRAINT "spin_results_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spin_results" ADD CONSTRAINT "spin_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."spin_results" ADD CONSTRAINT "spin_results_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_queue" ADD CONSTRAINT "email_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_queue" ADD CONSTRAINT "email_queue_spin_result_id_fkey" FOREIGN KEY ("spin_result_id") REFERENCES "public"."spin_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
