import Link from "next/link";

const useCases = [
  {
    number: "01",
    label: "先用地图选定今天的题型",
    title: "把 19 个题型变成可以逐步完成的路线",
    copy: "我先从语言知识、阅读、听力三条主线选一个具体問題，再进入对应页面。这样每次只面对一个明确判断，也更容易完成学习闭环。",
    href: "/n2",
    action: "打开 N2 学习地图",
  },
  {
    number: "02",
    label: "先掌握核心，再按需要深入",
    title: "先读快速复习区，卡住再查看完整说明",
    copy: "语言知识問題1–9里，我先看核心规律、易错对照和回忆卡；遇到不确定的接续、词义或例句，再展开对应学习单元的完整对比。",
    href: "/n2/language",
    action: "进入语言知识",
  },
  {
    number: "03",
    label: "词汇不是只看中文释义",
    title: "用遮挡回忆找出“以为认识、实际答不出”的词",
    copy: "词库页使用遮挡回忆。先看词义或提示，在脑中说出读音、意思和使用感觉，再展开核对；不会的词回到例句确认，而不是盲目扩大词表。",
    href: "/n2/vocabulary",
    action: "打开遮挡回忆词库",
  },
  {
    number: "04",
    label: "问题4先练反应，再看说明",
    title: "即时应答的关键不是翻译，是判断功能",
    copy: "我把問題4放在短时间训练里：先用翻卡练习，在三秒内判断对方是在请求、确认、拒绝、道歉还是说明状态；答得别扭时，再进入整合单元看自然回应、干扰点和完整例句。",
    href: "/n2/listening/problem-4",
    action: "练习听力問題4",
  },
];

const routine = [
  ["A", "选一个小目标", "不要写“今天复习 N2”。改成“問題7 的接续”或“問題4 的请求回应”。"],
  ["B", "先做主动回忆", "先遮住答案、先判断功能、先代入句子；不要一开始就展开表格。"],
  ["C", "把错误接回资料", "只展开和这次错误有关的学习单元，记住限制、反例和自然语境。"],
  ["D", "留下下一次入口", "在脑中或自己的笔记里记下“下一次先复习什么”，让下次从一个明确问题开始。"],
];

const weekly = [
  ["第 1–2 天", "语言知识", "选 1–2 个問題，完成快速复习区 + 少量整合单元。"],
  ["第 3 天", "词汇", "遮挡回忆一轮；只把真正不会的词带回例句。"],
  ["第 4 天", "听力問題4", "做短卡训练，按“功能”复盘而不是只记正确选项。"],
  ["第 5 天", "阅读或听力其他题型", "用页面的判断模型练时间分配与条件定位。"],
  ["第 6–7 天", "回看与模拟", "回到这周的错误点，再用真题原件作私下核对，不把原卷当成网页长文阅读。"],
];

export function StudyStory() {
  return (
    <article className="story-shell">
      <header className="story-hero">
        <div>
          <span>MY N2 STUDY NOTE</span>
          <h1>我是怎样使用<br />这套 N2 资料的。</h1>
          <p>我把自己的 N2 备考方法做成了这条可重复使用的学习路径：每次先判断、再确认，用例句理解限制，用短练习发现盲点，也把这套方法分享给后来学习的人。</p>
        </div>
        <aside>
          <span>THE PRINCIPLE</span>
          <strong>先判断，<br />再确认。</strong>
          <p>资料很多时，重点不是“全部看完”，而是每次都知道自己为什么要打开这一页。</p>
        </aside>
      </header>

      <section className="story-manifesto">
        <span>为什么这样整理</span>
        <p>日常复习需要清楚的先后顺序：先看核心判断和代表例句，再完成一小组练习；遇到错误时，回到对应单元查看限制、反例和完整对比。</p>
      </section>

      <section className="story-section" id="how-i-use-it">
        <div className="story-heading"><span>01 · HOW I USE IT</span><h2>我不会从第一页一直往下看。</h2><p>下面是我使用这套资料时，会反复回到的四个入口。你也可以照这个顺序开始。</p></div>
        <div className="story-use-grid">
          {useCases.map((item) => <article key={item.number}>
            <span>{item.number}</span><small>{item.label}</small><h3>{item.title}</h3><p>{item.copy}</p><Link href={item.href}>{item.action} <b>→</b></Link>
          </article>)}
        </div>
      </section>

      <section className="story-routine">
        <div className="story-heading"><span>02 · ONE STUDY LOOP</span><h2>一次复习，做完一个小闭环。</h2></div>
        <ol>
          {routine.map(([letter, title, copy]) => <li key={letter}><span>{letter}</span><div><h3>{title}</h3><p>{copy}</p></div></li>)}
        </ol>
      </section>

      <section className="story-section story-week">
        <div className="story-heading"><span>03 · A COPYABLE RHYTHM</span><h2>如果你刚开始，可以先这样安排一周。</h2><p>这是一份可借鉴的使用节奏，不是要求每个人照抄的硬性日程。时间少时，宁愿缩小到一个题型，也不要只把页面滑过去。</p></div>
        <div className="story-week-table">
          {weekly.map(([when, section, work]) => <div key={when}><span>{when}</span><strong>{section}</strong><p>{work}</p></div>)}
        </div>
      </section>

      <section className="story-sources">
        <div><span>ABOUT THE SOURCES</span><h2>网页学习页与原始资料，各自做不同的事。</h2></div>
        <div><p><strong>网页学习页</strong>用于理解题型、主动回忆、辨析和建立复习顺序。</p><p><strong>来源索引</strong>用于追溯整理依据；完整真题、听力原文和扫描件不作为公开网页正文重发。</p><Link href="/n2/resources">查看资料来源索引 →</Link></div>
      </section>

      <footer className="story-closing"><span>给使用这套资料的人</span><p>不用试图一次掌握全部内容。先找一个你会犹豫的点，做出判断，再用资料把这个判断修正得更准确。下一次复习从那个点继续就好。</p></footer>
    </article>
  );
}
