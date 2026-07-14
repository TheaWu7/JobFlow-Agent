import { MessageSquareText } from "lucide-react";
import type { InterviewArtifact, ReviewArtifact } from "@/types/agent";
import { PanelTitle } from "@/components/ui/PanelTitle";
import { TextBlock } from "@/components/ui/TextBlock";
import { ReviewView } from "./ReviewView";

export function InterviewView({ artifact }: { artifact: InterviewArtifact }) {
  const current = artifact.questions[artifact.currentIndex];
  return (
    <section className="space-y-4">
      <PanelTitle icon={<MessageSquareText className="h-5 w-5" />} title={artifact.title} />
      <div className="rounded-lg border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">当前进度</span>
          <span className="text-xs text-muted">
            {artifact.currentIndex + 1} / {artifact.questions.length}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-panel">
          <div
            className="h-2 rounded-full bg-brand"
            style={{ width: `${((artifact.currentIndex + 1) / artifact.questions.length) * 100}%` }}
          />
        </div>
      </div>
      {current && (
        <div className="rounded-lg border border-brand/30 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase text-brand">Question</p>
          <h3 className="mt-2 text-lg font-semibold leading-7">{current.question}</h3>
          <p className="mt-2 text-sm text-muted">考察点：{current.focus}</p>
        </div>
      )}
      <div className="space-y-3">
        {artifact.questions.map((question, index) => (
          <div key={question.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-panel text-xs font-semibold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{question.question}</p>
                <p className="mt-1 text-xs text-muted">{question.focus}</p>
                {question.answer && <TextBlock label="你的回答" text={question.answer} />}
                {question.feedback && <TextBlock label="实时点评" text={question.feedback} strong />}
                {question.followUp && <TextBlock label="追问" text={question.followUp} />}
              </div>
            </div>
          </div>
        ))}
      </div>
      {artifact.finalReview && <ReviewView artifact={artifact.finalReview} compact />}
    </section>
  );
}
