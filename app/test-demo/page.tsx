
"use client";
import AITestPlayer from "@/components/AITestPlayer";

const dummyTest = {
  id: "test-123",
  title: "Demo Scrolling Test",
  subject: "Math",
  questions: [
    {
      question: "This is a very long question designed to test the new scrolling feature. Imagine a complex geometry problem here that takes up multiple lines... " + "a ".repeat(500),
      options: [
        "Option A with long text " + "b ".repeat(50),
        "Option B with long text " + "c ".repeat(50),
        "Option C with long text " + "d ".repeat(50),
        "Option D with long text " + "e ".repeat(50)
      ],
      answer: 0,
      explanation: "This is the explanation."
    }
  ]
};

export default function TestDemo() {
  return (
    <div className="bg-background min-h-screen">
      <AITestPlayer test={dummyTest} onExit={() => window.location.href = '/'} />
    </div>
  );
}
