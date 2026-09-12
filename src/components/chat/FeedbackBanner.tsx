import React, { useState } from 'react';
import { FeedbackType } from '@/types/chatLog';
import { chatLogService } from '@/services/chatLogService';

interface FeedbackBannerProps {
  sessionId: string;
  userId: string;
  messageCount: number;
  onDismiss: () => void;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  sessionId,
  userId,
  messageCount,
  onDismiss,
}) => {
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: FeedbackType) => {
    if (isSubmitting || submittedFeedback) return;
    setIsSubmitting(true);
    try {
      await chatLogService.saveFeedback({
        sessionId: sessionId || 'unknown_session',
        userId: userId || 'guest',
        feedback: type,
        messageCount,
      });
      setSubmittedFeedback(type);
      setTimeout(() => {
        onDismiss();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      onDismiss();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="chat-feedback-banner" role="region" aria-label="Chat feedback">
      {submittedFeedback ? (
        <div className="chat-feedback-thankyou">
          <span className="text-emerald-600 font-medium">✨ ขอบคุณสำหรับข้อเสนอแนะเพื่อพัฒนาบริการครับ!</span>
        </div>
      ) : (
        <div className="chat-feedback-content">
          <div className="chat-feedback-header">
            <span className="chat-feedback-title">
              💬 ระบบช่วยคุณได้ดีไหมครับ?
            </span>
            <button
              type="button"
              className="chat-feedback-close"
              onClick={onDismiss}
              title="ปิด"
              aria-label="ปิดการให้ข้อเสนอแนะ"
            >
              &times;
            </button>
          </div>

          <div className="chat-feedback-actions">
            <button
              type="button"
              disabled={isSubmitting}
              className="chat-feedback-btn chat-feedback-btn--like"
              onClick={() => handleFeedback('like')}
            >
              <span>👍</span>
              <span>ชอบ</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className="chat-feedback-btn chat-feedback-btn--dislike"
              onClick={() => handleFeedback('dislike')}
            >
              <span>👎</span>
              <span>ไม่ชอบ</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              className="chat-feedback-btn chat-feedback-btn--excellent"
              onClick={() => handleFeedback('excellent')}
            >
              <span>✨</span>
              <span>สุดยอด</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackBanner;
