-- CreateTable
CREATE TABLE "public"."mandatory_prizes" (
    "id" SERIAL NOT NULL,
    "prize_id" INTEGER NOT NULL,
    "target_quantity" INTEGER NOT NULL,
    "issued_quantity" INTEGER NOT NULL DEFAULT 0,
    "period_start" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_end" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandatory_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mandatory_prizes_period_start_period_end_idx" ON "public"."mandatory_prizes"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "mandatory_prizes_is_active_idx" ON "public"."mandatory_prizes"("is_active");

-- AddForeignKey
ALTER TABLE "public"."mandatory_prizes" ADD CONSTRAINT "mandatory_prizes_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "public"."prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
