import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  MessageSquareText,
} from "lucide-react";
import styles from "./home.module.css";

const FEATURES = [
  {
    icon: FileText,
    title: "简历优化",
    desc: "上传简历，评估与岗位的匹配度，并给出逐条优化建议。",
  },
  {
    icon: MessageSquareText,
    title: "面试准备",
    desc: "解析岗位考点，生成面试题及参考答案，助你提前演练。",
  },
  {
    icon: ClipboardList,
    title: "面试复盘",
    desc: "回放面试记录，输出评分、短板标签与针对性练习计划。",
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        {/* Hero */}
        <section className={styles.hero}>
          <span className={styles.badge}>
            <BriefcaseBusiness size={16} />
            JobFlow Agent
          </span>
          <h1 className={styles.title}>你的 AI 求职工作台</h1>
          <p className={styles.subtitle}>
            从简历优化、面试准备到面试复盘，一站式准备好你的下一份工作。
          </p>
          <Link href="/workspace" className={styles.cta}>
            进入工作台
            <ArrowRight size={16} />
          </Link>
        </section>

        {/* Features */}
        <section className={styles.features}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={styles.card}>
              <Icon className={styles.cardIcon} />
              <h2 className={styles.cardTitle}>{title}</h2>
              <p className={styles.cardDesc}>{desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
