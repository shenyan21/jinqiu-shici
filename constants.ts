import { Dynasty, Poem } from './types';

export const INITIAL_POEMS: Poem[] = [
  {
    id: 'p1',
    title: '静夜思',
    author: '李白',
    dynasty: Dynasty.TANG,
    content: [
      '床前明月光，',
      '疑是地上霜。',
      '举头望明月，',
      '低头思故乡。'
    ],
    tags: ['月亮', '思乡', '经典']
  },
  {
    id: 'p2',
    title: '春晓',
    author: '孟浩然',
    dynasty: Dynasty.TANG,
    content: [
      '春眠不觉晓，',
      '处处闻啼鸟。',
      '夜来风雨声，',
      '花落知多少。'
    ],
    tags: ['春天', '自然']
  },
  {
    id: 'p3',
    title: '水调歌头·明月几时有',
    author: '苏轼',
    dynasty: Dynasty.SONG,
    content: [
      '丙辰中秋，欢饮达旦，大醉，作此篇，兼怀子由。',
      '明月几时有？把酒问青天。',
      '不知天上宫阙，今夕是何年。',
      '我欲乘风归去，又恐琼楼玉宇，高处不胜寒。',
      '起舞弄清影，何似在人间。',
      '转朱阁，低绮户，照无眠。',
      '不应有恨，何事长向别时圆？',
      '人有悲欢离合，月有阴晴圆缺，此事古难全。',
      '但愿人长久，千里共婵娟。'
    ],
    tags: ['中秋', '哲理', '月亮']
  },
  {
    id: 'p4',
    title: '声声慢·寻寻觅觅',
    author: '李清照',
    dynasty: Dynasty.SONG,
    content: [
      '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。',
      '乍暖还寒时候，最难将息。',
      '三杯两盏淡酒，怎敌他、晚来风急！',
      '雁过也，正伤心，却是旧时相识。',
      '满地黄花堆积，憔悴损，如今有谁堪摘？',
      '守着窗儿，独自怎生得黑！',
      '梧桐更兼细雨，到黄昏、点点滴滴。',
      '这次第，怎一个愁字了得！'
    ],
    tags: ['婉约', '愁']
  },
  {
    id: 'p5',
    title: '登高',
    author: '杜甫',
    dynasty: Dynasty.TANG,
    content: [
      '风急天高猿啸哀，',
      '渚清沙白鸟飞回。',
      '无边落木萧萧下，',
      '不尽长江滚滚来。',
      '万里悲秋常作客，',
      '百年多病独登台。',
      '艰难苦恨繁霜鬓，',
      '潦倒新停浊酒杯。'
    ],
    tags: ['秋天', '悲壮']
  }
];

export const COLORS = {
  cinnabar: '#8a3836', // Zhu Sha
  bamboo: '#5c6e58',   // Zhu Zi
  gold: '#d4af37',     // Liu Huang
  ink: '#1c1c1c',      // Mo
  paper: '#f7f5f0'     // Xuan Zhi
};

export const CARD_THEMES = [
  {
    name: 'Rouge (胭脂)',
    border: 'border-rose-900',
    bg: 'bg-gradient-to-br from-rose-50/90 to-rose-100/90',
    title: 'text-rose-900',
    text: 'text-rose-800',
    tag: 'text-rose-600',
    stamp: 'text-rose-900/10'
  },
  {
    name: 'Emerald (祖母绿)',
    border: 'border-emerald-800',
    bg: 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/90',
    title: 'text-emerald-900',
    text: 'text-emerald-800',
    tag: 'text-emerald-600',
    stamp: 'text-emerald-900/10'
  },
  {
    name: 'Indigo (靛青)',
    border: 'border-indigo-800',
    bg: 'bg-gradient-to-br from-indigo-50/90 to-indigo-100/90',
    title: 'text-indigo-900',
    text: 'text-indigo-800',
    tag: 'text-indigo-600',
    stamp: 'text-indigo-900/10'
  },
  {
    name: 'Amber (琥珀)',
    border: 'border-amber-800',
    bg: 'bg-gradient-to-br from-amber-50/90 to-amber-100/90',
    title: 'text-amber-900',
    text: 'text-amber-800',
    tag: 'text-amber-700',
    stamp: 'text-amber-900/10'
  },
  {
    name: 'Cyan (天青)',
    border: 'border-cyan-800',
    bg: 'bg-gradient-to-br from-cyan-50/90 to-cyan-100/90',
    title: 'text-cyan-900',
    text: 'text-cyan-800',
    tag: 'text-cyan-600',
    stamp: 'text-cyan-900/10'
  },
  {
    name: 'Violet (紫罗兰)',
    border: 'border-fuchsia-900',
    bg: 'bg-gradient-to-br from-fuchsia-50/90 to-fuchsia-100/90',
    title: 'text-fuchsia-900',
    text: 'text-fuchsia-800',
    tag: 'text-fuchsia-700',
    stamp: 'text-fuchsia-900/10'
  }
];

export const FIGURE_IMAGES = [
  "baishan.png", "benyue.png", "bottle.mei.png", "bottom.qunshan.png", "cao.png",
  "chuan.png", "ddh.png", "default.png", "denglou1.png", "denglou2.png",
  "denglouchuan.png", "fanchuan.png", "fenhua.png", "fenshu.png", "fenyue.png",
  "flower.moon.png", "girl.png", "guilinshanshui.png", "guohua.hehua.png", "guohua.hehua2.png",
  "guohua.hua.png", "he.png", "hehua.caise.png", "hehua.yu.shan.png", "hehua2.png",
  "hehua3.png", "hehuaqingting.png", "hehuayu.png", "hengshan.png", "heyue.png",
  "honghua.png", "huaniao.png", "huaping.png", "huashan.png", "hudie.png",
  "huizhuzi.png", "huofenghuang.png", "jianzhi.png", "jinyu.png", "left.bottom.mutong.png",
  "left.mei.png", "liahudie.png", "liangduohua.png", "lianiao.png", "long.png",
  "luohong.png", "lvzhu.png", "meihua.pink.png", "meihua.png", "meihua.shuimo.png",
  "meinv.png", "meinv2.png", "moon.png", "mozhu.png", "mujin.png",
  "mutong.png", "pomo.png", "pomodian.png", "qiangyan.png", "qunshan.png",
  "red.flower.png", "right.bottom.hehua.png", "right.bottom.honghehua.png", "right.bottom.hongmujin.png",
  "right.bottom.huaping.png", "right.bottom.qunshan.png", "right.bottom.yesun.png", "shuanghe.png",
  "shuanghe2.png", "song.png", "sundown.png", "wave.png", "xia.png",
  "yellow.flower.png", "yu.png", "yunshan.png", "yuweng.png", "zhuzi.png",
  "zuibaxian.png"
];