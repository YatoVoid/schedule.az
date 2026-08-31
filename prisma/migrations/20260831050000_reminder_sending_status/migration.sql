-- Add the transient claim state used by the reminder worker.
ALTER TYPE "ReminderStatus" ADD VALUE IF NOT EXISTS 'SENDING' AFTER 'PENDING';
